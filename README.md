# iter8

A small (2.6k gzipped) data transformation library that provides the familiar `Array` API plus extensions for use on JavaScript iterables.

* [Installation](#installation)
* [Basic Usage](#usage)
* [API Summary & Index](#api)
* [Usage Details](#usage-details)
* [API Reference](#api-reference)

## Why?

Iterators are a powerful new feature of ES6. ES6 `Set` and `Map` types offer some much needed support for basic data structures that support iterables directly. But, interop with arrays is inconvenient, and they lack native support for the most of the familiar array transformation methods.

iter8 seeks to bridge the gap between arrays and iterables, leveraging native data structures and adding some useful new transformation functions. Because everything is treated as a sequence, no work gets done until you ask for some specific output, and the sequence is only iterated as much as needed to perform your operations. 

iter8 is small (about 10k uglified, and 2.6k gzipped) and has no runtime dependencies. 

### immutability by design

Internally, iter8 handles everything as a sequence, and defers all queries for non-value-producing operations. All sequences are immutable naturally - you only access elements during processing, and not entire sets. 

### interop with `Map`, `Set`, `Array`, and `immutable` data structures

`Map` and `Set` can be constructed directly from an iterable sequence. iter8 lets you easily create these data structures, as every iter8 object is iterable. Same with data structures from the popular `immutable` library.

## Installation 

    npm install --save iter8
    
## Usage

Wrap any iterable object with `iter(..)` to create an `Iter` instance, and then use familiar `Array` methods for transformation. Many new transformation and traversal methods are also added, like `groupBy` and `flatten`. All evaluation is performed only when actual data is exposed via methods that return data, and it's all performed via iteration, so only elements actually used by an operation are traversed.

```Javascript
// someArray = [{active, id}, ... ]

const lookup = iter(someArray).
    .filter(e=>e.active)
    .map(e=>[e.id, e])
    .toArray();

const firstThree = lookup.take(3).toArray()  // array of only first 3 elements
const fourth = lookup.get(4)                 // value of 4th element in lookup
```

Let's do some more interesting things:

```Javascript
// money = [{ category, amount }]
// group all sale transactions by category, and return the
// # and total $ of sales per category

let money = iter(allSales)
    .groupBy('category')
    .map(([category, sales])=> {
        return {
            volume: sales.length,
            totalDollars: iter(sales).map(e=>e.amount).sum()    
        }
    }
```

Use data structures to help you:

```Javascript
let money = iter(allSales)
    .groupBy('category')
    .as(Map)

// `money` is a `Map` object with the category as the key 
let foodSales = money.get('food');
```

## API



#### static methods

These are used to create `Iter` instances. 
* [iter(ob)](#iterobj)
* [iter.fromObject(obj, [filter])](#iterfromobjectobj-filter)
* [iter.fromObjectOwn(obj, [filter])](#iterfromobjectownobj-filter)
* [iter.fromGenerator(iterator)](#iterfromgeneratorgenerator)
* [iter.generate(obj, n)](#itergenerateobj-n)

#### instance methods

These methods are available on all `Iter` instances. Methods identified with an asterisk (*) are essentially the same as their `Array` prototype equivalent, though there may be minor differences associated with dealing with sequences instead of arrays (see detail).

Iter8 objects have two types of methods: *transformation* and *value-producing*. Transformation methods return another `Iter` instance and can be chained.

##### transformation methods

*Mapping/Filtering/Grouping* 

* [flatten([recurse])](#flattenrecurse)
* [unique()](#unique)
* [groupBy(group)](#groupbygroup)
* [cast(Type)](#casttype)
* [map(callback(e, i), [thisArg])](#mapcallbacke-i-thisarg)*
* [filter(callback(e, i), [thisArg])](#filtercallbacke-i-thisarg)*
* [slice(begin, [end])](#slicebegin-end)*

*Merging/Set Operations*

* [except(sequence)](#exceptsequence)
* [intersect(sequence)](#intersectsequence)
* [union(sequence)](#unionsequence)
* [leftJoin(sequence, mergeCallback(leftItem, rightItem))](#leftjoinsequence-mergecallbackleftitem-rightitem)
* [joinOn(leftKeyCallback, rightKeyCallback)](#joinonleftkeycallback-rightkeycallback)
* [concat(obj, [obj, ...])](#concatobj-obj-)*

*Ordering*

* [orderBy(order)](#orderbyorder)
* [orderDesc(order)](#orderdescorder)
* [thenBy(order)](#thenbyorder)
* [thenDesc(order)](#thendescorder)
* [sort([callback(a, b)])](#sortcallbacka-b)*
* [reverse()](#reverse)*


*Traversal*

* [skip(n)](#skipn)
* [take(n)](#taken)

*Special*

* [do(callback, [thisArg])](#docallback-thisarg)
* [execute()](#execute)
* [forEach(callback(e, i), thisArg)](#foreachcallbacke-i-thisarg)*

##### value-producing methods 

*Element selection*

* [first([default])](#firstdefault)
* [last([default])](#lastdefault) 
* [get(n, [default])](#user-content-getn-default)

*Aggregation/Analysis*

* [count()](#count)
* [min([mapCallback])](#minmapcallback)
* [max([mapCallback])](#maxmapcallback)
* [sum([mapCallback])](#summapcallback)
* [some(callback(e, i), thisArg)](#somecallbacke-i-thisarg-value-producing)*
* [every(callback(e, i), [thisArg])](#everycallbacke-i-thisarg-value-producing)*
* [includes(value)](#includesvalue-value-producing)*
* [indexOf(value)](#indexofvalue-value-producing)*
* [lastIndexOf(value)](#lastindexofvalue-value-producing)*
* [findIndex(callback(e, i), [thisArg])](#findindexcallbacke-i-thisarg-value-producing)*
* [find(callback(e, i), [thisArg], [default])](#findcallbacke-i-thisarg-default-value-producing)*
* [reduce(callback(last, current, i), [initial])](#reducecallbacklast-current-i-initial-value-producing)*
* [reduceRight(callback(last, current, i), [initial])](#reducerightcallbacklast-current-i-initial-value-producing)*

*Comparison* 

* [sequenceEqual(sequence)](#sequenceequalsequence)

*Export* 

* [toArray()](#toarray)
* [toObject()](#toobject)
* [as(Type)](#astype) 
* [join(separator)](#joinseparator-value-producing)* 



### Usage Details

*Transformation* methods return a new instance of `Iter` with a new sequence that's the result of your operation. *Value-producing* methods return a value.

Execution of every query is deferred until a *value producing* method is called, which exports data outside the construct of an `Iter` object. If your query doesn't need to iterate over the entire sequence, it won't. Each value-producing methods returns something other than an `Iter` object thus ending the chain and causing execution.

In addition to its own API, `Iter` implements method for all the `Array` prototype methods that don't mutate the array. Some of these are value-producing, such as `indexOf`, while some are transformation functions and produce a new sequence, such as `filter`.

*Note about key-value pairs:* When describing an element as a *key-value pair*, this always means an array with two elements: `[key, value]`. This is the data structure used by JavaScript `Map` objects, and is also used for many other operations by `Iter` such as iterating over objects (property-value), and grouping (groupname-members).

*Note about use of undefined*: 

JavaScript arrays can be sparse, meaning certain indicies are not defined, and can also contain `undefined` elements. There is no notion of a sparse sequence, and `undefined` is a perfectly valid value.

Some methods like `first` could have no value to return, e.g. when called on a zero-length sequence. In JavaScript tradition, iter8 doesn't throw too many errors, but rather returns `undefined` in situations like this. This can result in indeterminate situations... was there no element, or was the result `undefined`?

To resolve this, methods like `first` include an argument that allows you to provide a default value to use other than `undefined`. However, your life will probably be easier if you avoid using `undefined` in sequences, so you can test for it conclusively, and use `null` instead to represent missing data.

## Creating Iter objects

iter8 exports a single function. This is a constructor, so it can be used for `instanceof` tests, but you can also simply invoke it rather than using `new`. To use iter8, create a new instance from an iterable object:

To create a new `Iter` from any iterable or plain JavaScript object, just:

```Javascript
import iter from `iter8`

let obj = iter()
// obj.toArray() === []

let obj = iter([1,2,3]).filter(e=>e<3)
// obj.toArray() === [2,3]
```

JavaScript objects become sequences of `[key, value]` pairs:

```Javascript
let obj = iter({ foo: 'bar', fizz: 'buzz'})
// obj.toArray() === [['foo', 'bar'], ['fizz', 'buzz]]
```

The default behavior is to enumerate own properties as well as the prototype chain. `constructor` is always ignored.

Key-value pairs make for easy interop with javascript `Map` objects, too:

```Javascript
let obj = iter({ foo: 'bar', fizz: 'buzz'}).as(Map);
// obj === Map { 'foo' => 'bar', 'fizz' => 'buzz' }
```

### API Reference

#### iter(obj)

Create a new `Iter` instance from an iterable object (e.g. an `Array`, `Map`, or `Set`), or a JavaScript object. When creating from an object using the default constructor, only "own" properties of the object are iterated.


```Javascript
import iter from 'iter8'

const seq = iter([{value: 1},{ value: 2}, {value: 3}]);

const val = seq.map(e=>e.value)
    .sum(e=>e > 1);
// val === 5

const lookup = iter({ foo: 1, bar: 2}).As(Map)
const val = lookup.get('foo')
// val === 1

```

#### iter.fromObject(obj, [filter])

Create a new `Iter` of `[key, value]` pairs by enumerating properties on `obj` and its prototype chain. This accesses the same properties as `for ... in`, except ignores `constructor`.

You can pass a callback `filter(prop)` to filter properties. Returning `false` from the callback will exclude the property.

#### iter.fromObjectOwn(obj, [filter])

Create a new `Iter` of `[key, value]` pairs, ignoring the prototype chain. This accesses the same properties as `Object.keys`.  

You can pass a callback `filter(prop)` to filter properties. Returning `false` from the callback will exclude the property.

The default object creation behavior when passing an object directly to `iter` is the same as `Iter.fromObjectOwn(obj)` with no filter.

#### iter.fromGenerator(generator)

You can create an `Iter` directly from a generator, or a function producing an iterator:

```Javascript
function* gen() {
    yield 1;
    yield 2;
    yield 3;
}
let x = iter.fromGenerator(gen).toArray()
/// x === [1,2,3]
```

#### iter.generate(obj, n) 

If `obj` is a `function(n)`, invoke it with the index from 0 to 1-n, and create a seqeunce from each value returned.

If `obj` is not a function, create a sequence of `obj` repeated `n` times.

```Javascript
let x = iter.generate('foo', 3).concat('bar').toArray() 
// x === ['foo','foo','foo','bar']

let x = iter.generate((i)=>i*2, 3).toArray()
// x === [0,2,4]
```

### Instance Methods

All the methods below are available on any `Iter` instance. 


// x === [1,2,"foo",3,4,[5]]
```

Recursive:

```Javascript
let x = iter([[1,2], "foo", [3,4,[5]]]).toArray()
// x === [1,2,"foo",3,4,5]
```

#### unique()

Return a sequence containing only one element for each distinct value in the sequence

```Javascript
let x = iter([1,2,3,3,4,4,5,4,5]]).unique().toArray()
// x === [1,2,3,4,5]
```

#### groupBy(group)

Return a sequence of *key-value pairs* where each key is a distinct group, and each value is an `Array` of all the elements from the original sequence in that group.


`group` can be a string, which will use the value of the given property on each element in the sequence, or a `callback` function that should return a value, in which case each distinct return value will be a group.

```Javascript
let arr = [
    { category: 'home', value: 1}, 
    { category: 'work', value: 2},
    { category: 'home', value: 3},
]

let x = iter(arr).groupBy('category').toArray()
// returns [
//    ['home', [
//      { category: 'home', value: 1},
//      { category: 'home', value: 3}
//    ]],
//    ['work', [
//      { category: 'work', value: 2}
//    ]]
//  ]
```

#### cast(Type)

Convert each element to an instance of `Type`. `Type` must be a constructor, and is invoked with the element as a single constructor argument for each element in the sequence.

#### map(callback(e, i), [thisArg])

Transform each element to the return value of `callback`

#### filter(callback(e, i), [thisArg])

Return a sequence including only elements that satisfy the condition in `callback`.

#### slice(begin, [end])

Return a subset of the original sequence. `skip` and `take` will do the same thing, and may be more expressive. Negative values for "begin" not currently supported.

### Ordering

#### orderBy(order)

Sort a sequence. `order` can be a string, which will use the named property of each object in the sequence, or a `function(e)`, which is invoked with each element in the sequence, and should return the value to use for the comparison during sorting. 

```Javascript
let seq = [
    { foo: 2, id: 1}, 
    { foo: 1, id: 2}, 
    { foo: 3, id: 3}
]

let x = iter(seq).orderBy('foo').map((e)=>e.id).toArray();
// x = [2,1,3]

let x = iter(seq).orderBy(e=>e.foo).map((e)=>e.id).toArray();
// x = [2,1,3]
```

#### orderDesc(order)

Same as `orderBy`, but sorts in descending order.

#### thenBy(order)

Chain a secondary (or n-ary) sort to an `orderBy` clause, which sorts orders which are equal during the primary sort. `order` can be a string (property name) or function (callback) to specify the comparison, same as `orderBy`

```Javascript
let seq = [
    { foo: 2, bar: 2, id: 1}, 
    { foo: 1, id: 2}, 
    { foo: 3, id: 3},
    { foo: 2, bar: 1, id: 4}
]

let x = iter(seq)
    .orderBy('foo')
    .thenBy('bar')
    .map((e)=>e.id).toArray();

// x = [2,4,1,3]
```

If you attempt to use a `thenBy` clause anywhere other than directly after another sorting clause, an error will be thrown.

#### thenDesc(order)

Same as `thenBy`, but sorts in descending order.

#### sort([callback(a, b)])

Sort the sequence. 

#### reverse()

Reverse the order of the sequence.

### Merging and Set Operations

#### except(sequence)

Return only elements in the first sequence not found in the 2nd

```Javascript
let x = iter([1,2,3,4,5]]).except([3,5]).toArray()
// x === [1,2,4]
```

#### intersect(sequence)

Return only elements in found in both sequences

```Javascript
let x = iter([1,2,3,4,5]]).except([3,5]).toArray()
// x === [1,2,4]
```

#### union(sequence)

Return a sequence containing all unique elements found in either sequence.

```Javascript
let x = iter([1,2,3]]).union([2,3,4]).toArray()
// x === [1,2,3,4]
```

#### leftJoin(sequence, mergeCallback(leftItem, rightItem))

Join two sequences, and return a single new sequence.

The default behavior assumes that the two sequences are `key-value pairs` with *unique keys* and the key will be used to join them. It returns a new sequence, where the value is result of invoking `mergeCallback(left, right, key)` for the *value* of each matched entries.

You can provide an `joinOn` clause to use sequences of any kind, including supporting sequences with duplicate keys.

There will be one row for each matching key in the right sequence. If keys are repeated in the left sequence, then each matching value in the right seqence will be repeated. 

```Javascript
let seq1 = [[0,'foo'], [1,'bar'], [1,'baz'], [2, 'fizz']] 
let seq2 = [[1,'FOO'], [2,'BAR'], [3,'NOPE']]

let merged = iter(seq1)
.leftJoin(seq2, (left, right='') => `${left}:${right}`);

/// merged.toArray() =  ['foo:', 'bar:FOO', 'baz:FOO', 'fizz:BAR']
```

#### joinOn(leftKeyCallback, rightKeyCallback)

Specify keys to use when joining two sequences. Only valid following a `leftJoin` clause. The two callbacks will be invoked against items from the left and right sequences, respectively, and should return a value that will be used to join against.

```Javascript
let seq1 = [
    { group: 1, value: 'bar' }, 
    { group: 1, value: 'foo', },
    { group: 2, value: 'fizz' },
    { group: 3, value: 'buzz' }
]
let seq2 = [
    { group: 1, value: 'a'},
    { group: 3, value: 'b'},
    { group: 3, value: 'c'},
    { group: 4, value: 'd'},
]

let merged = iter(seq1)
    .leftJoin(seq2, (left, right={}, key)=> `${key}:${left.value},${right.value || ''}`)    
    .joinOn(left => left.group, right => right.group)

// merged.toArray() ===["1:bar,a", "1:foo,a", "2:fizz,", "3:buzz,b", "3:buzz,c"]
```

Of note here is that the values from the *left* sequence group 3 are repeated, because there were multiple matches in the right group. The value for group 4 doesn't appear because it has no match from the left. Finally, we have to handle cases where `right` is missing in the merge callback, because there may be keys that appear only in the left sequence.

#### concat(obj, [obj, ...])

Return a new sequence composed of the original sequence, followed by each element it the other sequences passed as arguments, or the other arguments themselves. Arguments do not need to be iterable; any non-iterable arguments will be appended to the sequence as a new element.

Strings are a special case. Despite being iterable, they are always appended to the sequence as a single element, consistent with `Array.concat`.  

```Javascript
let x = iter([1,2,3]).concat([4,5,6], "foo", [7,8])
// x === [1,2,3,4,5,6,8 8]
```

Note that concat is not recursive; if an element of an appended sequence is itself iterable, it's not flattened.

```Javascript
let x = iter(['foo', 'bar']).concat(['baz', ['fizz'])
// x === ['foo','bar','baz',['fizz']
```

### Traversal 

#### skip(n)

Skip `n` elements in the sequence

```Javascript
let seq = iter([1,2,3,4,5])
let x = seq.skip(2).first()
// x === 3

let x = seq.skip(2).toArray()
// x === [3,4,5]
```

#### take(n)

Subset the sequence to include only the next `n` elements.

```Javascript
let x = iter([1,2,3,4,5]).skip(1).take(2).toArray() 
// x === [2,3]
```
 
Since each step operates against a new sequence defined by the previous step, successive `take` operations might operate counterintunitively -- e.g. `x.take(3).take(2)` is *not* the same as `x.take(5)` -- rather it's the same as `x.take(2)`.


### Special

#### do(callback, [thisArg])

`do` is similar to `forEach` in that it simply invokes a callback for each element in the sequence. Unlike `forEach`, `do` ignores the return value, and so cannot be canceled. The output sequence is always identical to the input sequence.

`do` is deferred, like every non-value-producing method, and so should not be used to immediately cause side effects like `forEach`.

#### execute()

Though this is not a value-producing method, it causes the query to be executed immediately, instead of waiting until a value-returning method is run. This is useful in cases where you want to keep your data in an `Iter` object, but cache an intermediate result for later use with other computations.

```Javascript
const intermediate = iter(something)
    .groupBy('category')
    .map([key, value]=>[key, iter(value).map(e=>e.amount).sum()])
    .execute();

let group1 = intermediate.filter([category]=>category === 'category 1').as(Map)
let group2 = intermediate.filter([category]=>category === 'category 2').as(Map)
```

Without using "execute" here, the "groupBy" etc. would be run twice for both `group1` and `group2` since execution of the entire query is deferred until a value-producing result, in this case `as(Map)`.

#### forEach(callback(e, i), thisArg) 

`forEach` executes the query immediately, and always returns `undefined`. If you want to cause side effects during normal sequence processing, use `do` instead.

`forEach` can be aborted by returning `false` from the callback. Any other return values are ignored. If `false` is returned, the rest of the sequence will not be iterated.

```Javascript
// log 'message' for all but the first 3 elements in the sequence
iter(arr).skip(3).forEach((e)=> {
    console.log(e.message)
});
```

### Value-returning methods

These methods all cause the query to execute and return some value or object.

#### first([default])

Return the first element in the sequence. Same as `get(0)`. If the sequence has no elements, return `undefined`, or the `default` if provided.

#### last([default])

Return the last element in the sequence. If the sequence has no elements, return `undefined` or `default`, if provided.

#### get(n, [default])

Return the nth (0-based) element in the sequence.


### Aggregation/Analysis methods

#### count()

Return the number of elements in the sequence.

```Javascript
let x = iter([1,2,3,4,5]).count()
// x === 5
```

#### min([mapCallback])

Return the minimum of all values in the sequence: If an optional `mapCallback` function is provided, the function will be invoked for each element, and the return value used as the value to compare.

```Javascript
let x = iter([3,1,2,4]).min()
// x===1
```

#### max([mapCallback])

Return the max of all values in the sequence. If an optional `mapCallback` function is provided, the function will be invoked for each element, and the return value used as the value to compare.

#### sum([mapCallback])

Return the sum of all values in the sequence. If an optional `mapCallback` function is provided, the function will be invoked for each element, and the return value used in the sum.

#### some(callback(e, i), [thisArg])

Test whether some elements in the sequence meet the criteria.

#### every(callback(e, i), [thisArg])

Test whether every element in the sequence meet the criteria.

#### includes(value)

Test whether `value` is in the sequence

#### indexOf(value)

Locate `value` in the sequence and return it's ordinal position from 0, or `-1` if not found.

#### lastIndexOf(value)

Locate the last occurrence `value` in the sequence and return it's ordinal position from 0, or `-1` if not found.

#### findIndex(callback(e, i), [thisArg])

Locate the element that satisfies the condition, and return it's ordinal position from 0. If the condition is never satisfied, return `-1`

#### find(callback(e, i), [thisArg], [default])

Attempt to locate an element in the sequence by using a `callback`, which should return true when the element has been located. If the condition is never satisfied, return `undefined` or `default`, if provided.

#### reduce(callback(last, current, i), [initial])

(todo - Array.reduce)

#### reduceRight(callback(last, current, i), [initial]) *value-producing*

(todo - Array.reduceRight)

#### sequenceEqual(sequence)

Test whether the two sequences are equal by comparing each element sequentially. Returns `true` only if the sequences contain the same number of elements, and each element is equal.

### Export methods

These methods export the sequence to some other data structure.

#### toArray()

Return an array created by iterating the sequence completely. Same as `as(Array)`.

#### toObject()

Assuming the sequence contains *key-value pairs* and each key is unique, return an object with `{property: value}` for each key-value pair.

This method makes no effort to validate the elements in your sequence, rather, it just uses `value[0]` for each key and `value[1]` for each value. It is often useful in conjunction with `groupBy`, which returns a sequence of key/value pairs, or when `iter` is created from a `Map` object. 

```Javascript
let myMap = new Map();
myMap.set('foo', 'bar')
myMap.set('fizz', 'buzz')

let x = iter(myMap).toObject();

// x === { 
//    "foo": "bar",
//    "fizz": "buzz"
//}
``` 

#### as(Type)

Creates an instance of `Type` using the sequence as a single constructor argument. This works well with the ES6 `Map` and `Set` types. You can also use `Array`, which is a special case, even though constructing an `Array` with an iterable doesn't work in plain JavaScript. You can use any user-defined types that can accept an iterable as a single constructor argument.

```Javascript
// make a lookup table returning all elements of the source grouped by the
// values of property `category`

let map = iter(something).groupBy('category').as(Map)
```

#### join([separator=',']) *value-producing*

Join all methods using the `separator` as a string. If the contents of the sequence aren't strings, `toString()` will be invoked on each element. 

### Transformation methods

These methods return a new sequence based on some transformation of the original one. These include aggregation, traversal, and set operations. These are all chainable, and execution is always deferred. The sequence will only be iterated as much as necessary to perform a given transformation. Some methods will by nature always iterate over the entire sequence, such as set operations.

#### flatten([recurse])

For each element in the sequence, if the element is an array, return each element in the array as a new element in the sequence.

When `recurse` is truthy, elements within each element that are also iterable, will continue to be flattened.

Like `concat`, strings are a special case, and are not iterated over.

```Javascript
let x = iter([[1,2], "foo", [3,4,[5]]]).toArray()## Roadmap

### Construct from object enhancements

Right now property getters are never enumerated, need to add this option. 

### Missing methods

A few things still to add:

##### take(callback)

Take elements as long as `callback(value)` is true

##### skip(callback)

ditto

##### zip(other, fn)

Apply a function to the corresponding elements of two sequences; return the output of the function for each element.

### Typescript

I did a basic TypeScript conversion, but it doesn't actually work, and adds about 15% to the size anyway because of some
optimizations that aren't directly possible with TS and Babel. But it's good enough to generate a typings file. Might try to 
get it completely converted and optimized entirely in TS which would make it easier.

### Extensibility

Add an extension point for adding methods.

### Equality comparison

Some complex set operations are much more useful if a notion of equality comparison other than simply reference equality (e.g. `===`) can be used when performing the operation. In C# think of `getHashCode` and `equals`. There's a vague notion of this with `valueOf` in Javascript, but it doesn't work for direct comparisons, only relative ones (`<` and `>`). 

It would be nice to implement a convention such as `equals` which some operations will use to perform equality comparisons, if available.e

### Performance

I haven't evaluated it at all. This has proven plenty fast for the use cases I've had so far. Because the process of iteration involves many more function invocations then simple looping, it's certainly slower. I'm interested in optimizing as much as possible, but the goal is not extremely high performance for large arrays, but rather expressiveness for complex transformations. 

### Size Optimization

It's about 10K compressed right now. There are opportunities for code reuse that I haven't taken advantage of that could reduce the size of this library.

The size is not an issue for me. If it seems useful to some to break it out into modules with separate entry points to allow only including parts that are needed, I would conisder it.

## Similar Libraries

There are a bunch of them. It was actually pretty hard to find a good npm package name. :)
    
I had the following needs in mind when creating this:

* easy interop with `Array`, `Map`, `Set` and native Javascript objects
* complete support of `Array` API
* extended API for traversal, and set and group operations 
* good documentation
* small

All the similar packages I found missed on one or more of these points. 
