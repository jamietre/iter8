# iter8

iter8 is a small (under 4k gzipped) data transformation library that works with JavaScript iterables. It provides the familiar `Array` API plus a full complement of sequence and set operations like `intersect`, `union`, `except`, and `leftJoin`.

## Features

* Works with all iterators, iterables, and generators
* Implements complete `Array` API, plus many additions
* Painless interop with `Array`, `Set`, and `Map` types
* Deferred execution of all sequence enumeration
* Correct `return()` handling for incomplete iterators
* Caches iterator output: automatically re-use sequences without access to the creator
* Powerful reflection capability for iterating object properties and getters/setters
* Argument type checking
* Includes Typescript typings for complete GUI support of its API

## Contents

* [Installation](#installation)
* [Basic Usage](#usage)
* [API Summary & Index](#api)
* [Usage Details](#usage-details)
* [API Reference](#api-reference)
* [Performance](#performance)
* [Roadmap](#roadmap)

## Installation 

iter8 is on npm:

    npm install --save iter8

Standalone packages for use in a browser that create a global `iter` can be downloaded from github under *dist*.

## Usage

Wrap any iterable object with `iter(..)` to create an `Iter` instance, and then use familiar `Array` methods for transformation. Many new transformation and traversal methods are also added, like `groupBy` and `flatten`. All evaluation is performed only when actual data is exposed via methods that return data, and it's all performed via iteration, so only elements actually used by an operation are traversed.

```Javascript
// someArray = [{active, id}, ... ]

const lookup = iter(someArray)
    .filter(e=>e.active)
    .map(e=>[e.id, e])
    .toArray();

const firstThree = lookup.take(3).toArray()  // array of only first 3 elements
const fourth = lookup.get(4)                 // value of 4th element in lookup
```

Let's do some more interesting things:

```Javascript
// money = [{ category, amount }, ... ]
// group all sale transactions by category, and return the
// # and total $ of sales per category

let money = iter(allSales)
    .groupBy('category')
    .map(([category, sales])=> {
        return {
            volume: sales.length,
            totalDollars: iter(sales).map(e=>e.amount).sum()    
        }
    })
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

* [iter(obj)](#iterobj)
* [iter.fromObject(obj, [filter])](#iterfromobjectobj-filter)
* [iter.fromObjectOwn(obj, [filter])](#iterfromobjectownobj-filter)
* [iter.generate(obj, n)](#itergenerateobj-n)
* [iter.reflect(obj, [recurse], [filter])](#iterreflectobj-recurse-filter)

#### instance methods

These methods are available on all `Iter` instances. Methods identified with an asterisk (*) are essentially the same as their `Array` prototype equivalent, though there may be minor differences associated with dealing with sequences instead of arrays (see detail).

Iter8 objects have two types of methods: *transformation* and *value-producing*. Transformation methods return another `Iter` instance and can be chained.

##### transformation methods

*Mapping/Filtering/Grouping* 

* [flatten([recurse])](#flattenrecurse)
* [unique([key])](#uniquekey)
* [groupBy([key], [map])](#groupbykey-map)
* [cast(Type)](#casttype)
* [keys()](#keys)
* [values()](#values)
* [map(callback, [thisArg])](#mapcallbacke-i-thisarg)*
* [filter(callback, [thisArg])](#filtercallbacke-i-thisarg)*
* [slice(begin, [end])](#slicebegin-end)*

*Merging/Set Operations*

* [except(sequence)](#exceptsequence)
* [intersect(sequence)](#intersectsequence)
* [union(sequence)](#unionsequence)
* [leftJoin(sequence, callback)](#leftjoinsequence-callbackleftitem-rightitem)
* [on(left: key, right: key)](#onleft-key-right-key)
* [concat(obj, [obj, ...])](#concatobj-obj-)*

*Ordering*

* [orderBy(order)](#orderbykey)
* [orderByDesc(order)](#orderbydesckey)
* [thenBy(order)](#thenbykey)
* [thenByDesc(order)](#thenbydesckey)
* [sort([callback])](#sortcallbacka-b)*
* [reverse()](#reverse)*


*Traversal*

* [skip(n)](#skipn)
* [skipWhile(callback)](#skipwhilecallback)
* [take(n)](#taken)
* [takeWhile(callback)](#takewhilecallback)

*Special*

* [do(callback, [thisArg])](#docallback-thisarg)
* [execute()](#execute)

##### value-producing methods 

*Element selection*

* [first([default])](#firstdefault)
* [last([default])](#lastdefault) 
* [get(n, [default])](#user-content-getn-default)

*Aggregation/Analysis*

* [count()](#count)
* [min([callback])](#minkey)
* [max([callback])](#maxkey)
* [sum([callback])](#sumkey)
* [mean([callback])](#meankey)
* [some(callback, [thisArg])](#somecallbacke-i-thisarg)*
* [every(callback, [thisArg])](#everycallbacke-i-thisarg)*
* [includes(value)](#includesvalue)*
* [indexOf(value)](#indexofvalue)*
* [lastIndexOf(value)](#lastindexofvalue)*
* [findIndex(callback, [thisArg])](#findindexcallbacke-i-thisarg)*
* [find(callback, [thisArg], [default])](#findcallbacke-i-thisarg-default)*
* [reduce(callback, [initial])](#reducecallbacklast-current-i-initial)*
* [reduceRight(callback, [initial])](#reducerightcallbacklast-current-i-initial)*

*Comparison* 

* [sequenceEqual(sequence)](#sequenceequalsequence)

*Export* 

* [toArray()](#toarray)
* [toObject()](#toobject)
* [as(Type)](#astype) 
* [join([separator])](#joinseparator)* 

*Special*

* [forEach(callback, thisArg)](#foreachcallbacke-i-thisarg)*

### Usage Details

*Transformation* methods return a new instance of `Iter` with a new sequence that's the result of your operation. *Value-producing* methods return a value.

Execution of every query is deferred until a *value producing* method is called, which exports data outside the construct of an `Iter` object. If your query doesn't need to iterate over the entire sequence, it won't. Each value-producing methods returns something other than an `Iter` object thus ending the chain and causing execution.

This is extremely powerful, but can have unitended side effects, particular when chaining queries with recursion or loops. If you use data passed by reference during a transformation, the value used will be the value *at the time the transformation happens* -- not when the query was created. You can use the `execute` method as needed to fully iterate a sequence.

In addition to its own API, `Iter` implements method for all the `Array` prototype methods that don't mutate the array. Some of these are value-producing, such as `indexOf`, while some are transformation functions and produce a new sequence, such as `filter`.

##### "key" argument

For many methods that require a key for equality comparison, like `groupBy`, `leftJoin`, and set operations, there will be an parameter of type `key`. This means that the argument can be one of three things:

* a `function(item)` that, given an item in a sequence, returns a key that identifies it
* a non-null, non-undefined value, typically a string or number, which identifies a property or index on the item in the seqeunce whose value is the key. 
* a falsy value, meaning the item itself is the key.

This means you can unversally use strings to refer to an object property in these situations, so the following are identical:

```Javascript
let x = item.groupBy('name')
let x = item.groupBy(e => e.name)
```

##### Note about key-value pairs

 When describing an element as a *key-value pair*, this always means an array with two elements: `[key, value]`. This is the data structure used by JavaScript `Map` objects, and is also used for many other operations by `Iter` such as iterating over objects (property-value), and grouping (groupname-members).

##### Note about use of undefined

JavaScript arrays can be sparse, meaning certain indices are not defined. The can also contain `undefined` elements which are treated differently by some native operations. With sequences, there is no notion of sparseness, and `undefined` is a perfectly valid value. 

Some methods like `first` could have no value to return, e.g. when called on a zero-length sequence. In JavaScript tradition, iter8 doesn't throw too many errors, but rather returns `undefined` in situations like this. This can result in indeterminate situations... was there no element, or was the result `undefined`?

To resolve this, methods like `first` include an argument that allows you to provide a default value to use other than `undefined`. However, your life will probably be easier if you avoid using `undefined` in sequences, so you can test for it conclusively, and use `null` instead to represent missing data.

##### note about iterator.return()

In addition to a `next()` method, iterators may also implement a `return()` method: see [overview from Exploring ES6](http://exploringjs.com/es6/ch_iteration.html#sec_take_closing)

When you use a value-producing method, iter8 may not completely iterate over iterable objects it consumes. For example, if `indexOf` is successful, it will only iterate until it finds the element it's looking for.

The `return()` method can be implemented by iterables to allow them to clean up resources. iter8 will correctly invoke this method when needed whenever a query is executed.

In one situation, iter8 will not close an iterable that it consumes. This is when you actually source iter8 from an iterable (versus an iterator). Because iter8 was not resonsible for creating the iterable, it assumes it is also not responsible for cleaning it up. That is, the programmer could intend to take some further action on it after iter8 was done. An example:

```Javascript
const set = new Set([1, 2, 3, 4, 5])
let values = set.values();
const obj = iter(values).take(3).toArray()   // obj === [1, 2, 3]

let remainder = [];
for (let item of values) {
    remainder.push(item)
}
// remainder = [4, 5]
```

Because `Set.values()` returns an *iterator* object (rather than an iterable, from which iter8 would request a new iterator), it is considered to not be owned by iter8, and so it won't be closed after use.

Consider an alternate implementation:

```Javascript
const set = new Set([1, 2, 3, 4, 5])
let values = { 
    [Symbol.iterator]: function() { 
    	return set.values() 
    }
}

// ... rest code is the same

// remainder = [1, 2, 3, 4, 5]
```

In this case we created an actual `iterable` object (not an iterator) that returns the new sequence of keys. The output of "remainder" in this case will be the entire sequence. Each operation on values gets a new iterator from `set.values()` so the state is never preserved.


## Creating Iter objects

iter8 exports a single function. This is a constructor, so it can be used for `instanceof` tests, but you can also simply invoke it rather than using `new`. To use iter8, create a new instance from an iterable object:

Create a new `Iter` from an iterable object:

```Javascript
import iter from `iter8`

let obj = iter()
// obj.toArray() === []
// obj instanceof iter === true 

let obj = iter([1,2,3]).filter(e => e<3)
// obj.toArray() === [2,3]
```

Map objects become sequences of `[key, value]` pairs:

```Javascript
let map = new Map(['foo', 'bar'], ['fizz,'buzz'])
let obj = iter(map)

// obj.toArray() === [['foo', 'bar'], ['fizz', 'buzz]]
// obj.toObject() === { foo: 'bar', fizz: 'buzz'}
// obj.as(Map) === Map { 'foo' => 'bar', 'fizz' => 'buzz' }
```

You can create an `Iter` directly from a generator (a function producing an iterator):

```Javascript
function* gen() {
    yield 1;
    yield 2;
    yield 3;
}

let obj = iter(gen);
/// obj.toArray() === [1,2,3]
```

You can can work with iterators directly, too:

```Javascript
let map = new Map([1, 'foo'], [2,'bar'], [3, 'baz'])

// map.values() returns an iterator - not an iterable!
let obj = iter(map.values())

// obj.toArray() === ['foo', 'bar', 'baz']
```




### API Reference

#### iter(obj)

Create a new `Iter` instance from:

* an `iterable` object. Iterable objects have a method `[Symbol.iterator]` that returns an `iterator`. Most JavaScript types that are containersimplement this, e.g. an `Array`, `Map`, `Set`, and `arguments`.
* an `iterator`. Iterators are entities that have a method `next()`, and should implement the *iterator protocol*. Some built-in methods return iterators, like `Map.values()`
* a `generator`. If you pass a function to `iter`, it is assumed to be a generator.

See [iterator protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) for details on the specific entity types.

When `iterable` and `generator` types are used, each time the sequence for an `Iter` object is enumerated, the seqeunce will be restarted from the original source. That is, we will invoke `source[Symbol.iterator]()` for an iterable, and `generator()` for a generator, to obtain the seqeunce for a given enumeration.

With an `iterator`, however, we only have the sequence itself. We can't obtain it again. In this case, iter8 will *cache the sequence* the first time it is enumerated, and re-use the cached values for any subseqeuent enumeration. For this reason any operations on an `Iter` object sourced from an iterator are guaranteed to be reproducible, whereas operations on the others are not, since the sequence could be different each time it is requested. If you want to enforce reproducibility, then you should always cache a sequence at the beginning of an operation. See `execute`. 

```Javascript
import iter from 'iter8'

const seq = iter([{value: 1},{ value: 2}, {value: 3}]);
const val = seq
    .filter(e=>e.value > 1)
    .sum('value');

// val === 5

const lookup = iter([['foo', 1], ['bar', 2]]).as(Map)
const val = lookup.get('bar')

// val === 2
```

#### iter.fromObject(obj, [filter])

Create a new `Iter` of `[key, value]` pairs by enumerating properties on `obj` and its prototype chain. This accesses the same properties as `for ... in`, except ignores `constructor`.

You can pass a callback `filter(prop)` to filter properties. Returning `false` from the callback will exclude the property.

Example:

```Javascript
let obj = iter({ foo: 'bar', fizz: 'buzz'})
// obj.toArray() === [['foo', 'bar'], ['fizz', 'buzz]]
```

#### iter.fromObjectOwn(obj, [filter])

Create a new `Iter` of `[key, value]` pairs, ignoring the prototype chain. This accesses the same properties as `Object.keys`.  

You can pass a callback `filter(prop)` to filter properties. Returning `false` from the callback will exclude the property.

The default object creation behavior when passing an object directly to `iter` is the same as `Iter.fromObjectOwn(obj)` with no filter.

#### iter.generate(obj, n) 

If `obj` is a `function(n)`, invoke it with the index from 0 to 1-n, and create a sequence from each value returned.

If `obj` is not a function, create a sequence of `obj` repeated `n` times.

```Javascript
let x = iter.generate('foo', 3).concat('bar').toArray() 
// x === ['foo','foo','foo','bar']

let x = iter.generate((i)=>i*2, 3).toArray()
// x === [0,2,4]
```

### iter.reflect(obj, [recurse], [filter])

Generate metadata about an object and optionally it's prototype chain (if `recurse===true`). Exclude methods based on a `filter(name)` callback.

`reflect` includes all regular properties as well as getters/setters. For the purposes of this documentation, a property is called a `field` if it's a regular property, and a `property` if it's a getter/setter.

This method returns a sequence of *key-value* pairs where the key is the property name, and the value is an object with properties:

* *type*: the data type for fields ('string', 'number', 'function', 'object', 'null', 'undefined'). For properties the value is `null`. (Actuall null values are the string `"null"`).
* *field*: true for regular properties, false for getter/setter
* *writeable*: boolean, the property can be assigned to
* *get*: the property getter function or `undefined`
* *set*: the property setter function or `undefined`
* *configurable*: the property is configurable
* *enumerable*: the property is enumerable
* *depth*: the depth in the prototype chain. 0 means the object itself, 1 means its prototype, 2 means the prototype's prototype, etc.


### Instance Methods

All the methods below are available on any `Iter` instance. 

### Transformation methods

These methods return a new sequence based on some transformation of the original one. These include aggregation, traversal, and set operations. These are all chainable, and execution is always deferred. The sequence will only be iterated as much as necessary to perform a given transformation. Some methods will by nature always iterate over the entire sequence, such as set operations.

#### flatten([recurse])

For each element in the sequence, if the element is an array, return each element in the array as a new element in the sequence.

When `recurse` is truthy, elements within each element that are also iterable, will continue to be flattened.

Like `concat`, strings are a special case, and are not iterated over.

```Javascript
let x = iter([[1,2], "foo", [3,4,[5]]]).flatten().toArray()

// x === [1,2,"foo",3,4,[5]]
```

Recursive:

```Javascript
let x = iter([[1,2], "foo", [3,4,[5]]]).flatten(true).toArray()
// x === [1,2,"foo",3,4,5]
```

#### unique([key])

Return a sequence containing only one element for each distinct value in the sequence. 

[`key`](#get-key-argument) can be used to identify the value for equality comparison. With no arguments, the values themselves are made used. If a key is identified, then the *first* value in the sequence matching the key will be returned.

```Javascript
let x = iter([1,2,3,3,4,4,5,4,5]]).unique().toArray()
// x === [1,2,3,4,5]


let x = iter([ 
    { key: 1, value: 'foo'},
    { key: 1, value: 'foo-2'},
    { key: 2, value: 'bar'},
    { key: 3, value: 'fizz'},
    { key: 3, value: 'buzz'},
  ])
    .unique('key')
    .map(e=>e.value)
    .toArray()
// x === ['foo', 'bar', 'fizz']
```

#### groupBy([key, map])

Return a sequence of *key-value pairs* where each key is a distinct group, and each value is an `Array` of all the elements from the original sequence in that group.

[`key`](#key-argument) identifes the value on which to group.
`map` is also a [key argument](#key-argument) which identifies a transform to be applied to each element from the input when it's added to a group.

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

Using a map:

```Javascript
let x = iter(arr).groupBy('category', 'value')toArray()
// returns [
//    ['home', [ 1,3 ],
//    ['work', [ 2 ] ]
//  ]

```


#### cast(Type)

Convert each element to an instance of `Type`. `Type` must be a constructor, and is invoked with the element as a single constructor argument for each element in the sequence.

A common use case for this is dealing with `[key, value]` pairs. Imagine a class `Kvp` that takes an array with two elements as its constructor argument, and returns an object exposing `key` and `value` properties. You could do things like this:


### keys()

Assuming a sequence of `[key, value]` pairs, return a new sequence including only the keys. This is the same as `map(0)` but will perform basic type checking.

### values()

Assuming a sequence of `[key, value]` pairs, return a new sequence including only the keys. This is the same as `map(1)` but will perform basic type checking.

#### map(callback(e, i), [thisArg])

Transform each element to the return value of `callback`

#### filter(callback(e, i), [thisArg])

Return a sequence including only elements that satisfy the condition in `callback`.

#### slice(begin, [end])

Return a subset of the original sequence. `skip` and `take` will do the same thing, and may be more expressive. Negative values for "begin" not currently supported.

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

If using an `on` clause to specify keys, for keys found in both sequences, the value from the original sequence will be returned in the resulting sequence.  

```Javascript
let x = iter([1,2,3]]).union([2,3,4]).toArray()
// x === [1,2,3,4]
```

#### leftJoin(sequence, callback(leftItem, rightItem))

Join two sequences, and return a single new sequence.

The default behavior with no `on` clause assumes that the two sequences are `[key, value]` pairs with *unique keys*, e.g. `Map`s,  and the key will be used to join them. It returns a new sequence, where the value is result of invoking `mergeCallback(left, right, key)` for the *value* of each matched entries.

You can provide an `on` clause to use sequences of any kind, including supporting sequences with duplicate keys.

There will be one row for each matching key in the right sequence. If keys are repeated in the left sequence, then each matching value in the right seqence will be repeated. 

```Javascript
let seq1 = [[0,'foo'], [1,'bar'], [1,'baz'], [2, 'fizz']] 
let seq2 = [[1,'FOO'], [2,'BAR'], [3,'NOPE']]

let merged = iter(seq1)
.leftJoin(seq2, (left, right='') => `${left}:${right}`);

/// merged.toArray() =  ['foo:', 'bar:FOO', 'baz:FOO', 'fizz:BAR']
```

#### on(left: key, [right: key])

Specify [keys](#get-key-argument) to use when performing operations that involve merging two sequences. This is valid only when it immediately follows one of these operations:

* except
* intersect
* union
* leftJoin

The two arguments will be used to obtain keys from the left and right sequences, respectively. The value that will be used to perform a set or join operation.

If only the `left` key is provided, then the same logic will be used on both the left and right sequences. If you wish to explicitly specify a key provider for only the left or right sequence, you can pass `null` or `undefined` as the other argument, and the values from that sequence will used directly as the key.

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

let inBoth = iter(seq1)
    .intersect(seq2)
    .on(e=>e.group);

// inBoth.toArray() = [{ group: 1, value: 'bar' }]
```

Note that the value returned by `intersect` is the value from the *original* sequence when using an `on` clause. The only time a value from the other sequence will appear when using `on` is in the case of a `union`, and it doesn't also appear in the original sequence. 

```Javascript
let merged = iter(seq1)
    .leftJoin(seq2, (left, right={}, key)=> `${key}:${left.value},${right.value || ''}`
    .on(left => left.group, right => right.group)

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

### Ordering

#### orderBy(key)

Sort a sequence by comparing each element according to the value specified [`key`](#key-argument). 

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

#### orderByDesc(key)

Same as `orderBy`, but sorts in descending order.

#### thenBy(key)

Chain a secondary (or n-ary) sort to an `orderBy` clause, which sorts orders which are equal during the primary sort, using the [`key`](#get-key-argument).

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

#### thenByDesc(key)

Same as `thenBy`, but sorts in descending order.

#### sort([callback(a, b)])

Sort the sequence according to the relative comparison value returned by the callback. Same as Array.sort.

#### reverse()

Reverse the order of the sequence.


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


#### skipWhile(callback)

Skip elements in the sequence as long as the current element passes a test.

Each item is passed to the `callback` function and skipped as long as the element passes the test

```Javascript
let seq = iter([1,2,3,4,5])
let x = seq.skipWhile(e=>e < 4).first()
// x === 4
```

#### take(n)

Subset the sequence to include only the next `n` elements.

```Javascript
let x = iter([1,2,3,4,5]).skip(1).take(2).toArray() 
// x === [2,3]
```
 
Since each step operates against a new sequence defined by the previous step, successive `take` operations might operate counterintunitively -- e.g. `x.take(3).take(2)` is *not* the same as `x.take(5)` -- rather it's the same as `x.take(2)`.

#### takeWhile(callback)

Subset the sequence to include items all items until the first item that fails a test. 

Each item is passed to the `callback` function and included in the sequence until the first item fails the test.

```Javascript
let x = iter([1,2,3,4,5]).skipWhile(e=>e < 4) 
// x === [1,2,3]
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

#### min([key])

Return the minimum of all values in the sequence. If an optional [`key`](#get-key-argument) is provided, it will be used to produce the value to sum.

```Javascript
let x = iter([3,1,2,4]).min()
// x===1
```

#### max([key])

Return the max of all values in the sequence. If an optional [`key`](#get-key-argument) is provided, it will be used to produce the values to evaluate.

#### sum([key])

Return the sum of all values in the sequence. If an optional [`key`](#get-key-argument) is provided, it will be used to produce the values to evaluate.

#### mean([key])

Return the mean (average) of all values in the sequence. If an optional [`key`](#get-key-argument) is provided, it will be used to produce the values to evaluate.


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

#### reduceRight(callback(last, current, i), [initial])

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

Creates an instance of `Type` using the sequence as a single constructor argument. This works well with the ES6 `Map` and `Set` types, or any other type constructed from an iterable. 

You can also use `Array` or `Object`, which are special cases. These are aliases for the `toArray()` and `toObject()` methods.

```Javascript
// make a lookup table returning all elements of the source grouped by the
// values of property `category`

let map = iter(something).groupBy('category').as(Map)
let arr = iter(something).as(Array)
```

#### join([separator=","])

Join all methods using the `separator` as a string. If the contents of the sequence aren't strings, `toString()` will be invoked on each element. 

### Special Method

#### forEach(callback(e, i), thisArg) 

`forEach` executes the query immediately, iterates over all values in the sequence, and always returns `undefined`. If you want to cause side effects during normal sequence processing, use `do` instead.

```Javascript
// log 'message' for all but the first 3 elements in the sequence
iter(arr).skip(3).forEach((e)=> {
    console.log(e.message)
});
```

### Performance

While performance isn't my primary goal with this libary, I think some benchmarks are useful to understand how this performs overall and if it is adequate for your needs. I have some simple tests that compare it to lodash, which I consider the benchmark standard. iter8 will probably never be as fast as lodash for operations that involve iterating the entire sequence -- the purpose of these tests isn't to try to catch up, but just to compare.

Very roughly, whe starting with `Array` sources, typical complex operations that involve iterating the entire set seem to be about 3-5 times faster in lodash. This isn't likely to improve much, except to the extent that the Javascript engines can improve iteration access to arrays interally. It's just a fact of life since iterating over arrays is slower than accessing array elements by index.

[This jsperf](https://jsperf.com/four-iteration-methods) compares four methods of iterating an array. Using array indices is *four times faster* (in Chrome) than `for-of` -- which pretty much explains the performance difference compared to lodash. Other browsers show even more dramatic differences:

* Edge is *100 times faster* for indexed access
* Firefox is *40 times faster* for indexed access
* Brave is about *15 times faster* for indexed access

If your source is *not* already an `Array`, then iter8 may very well be faster, since you'd actually have to convert it to an array first to use with lodash. A simple test of "except" involving sources in `Set` objects shows iter8 to be about 20% faster.

At the end of the day - both lodash and iter8 are *extremely fast*. iter8 can sum 1,000,000 integers on my 2012 era Core i7 laptop in 0.05 seconds. Lodash can do it in .012 seconds! So if your needs are extremely computation heavy involving very large datasets, and eking out every bit of performance is critical, then lodash is certainly the best choice. But for most typical programming tasks, the difference is not likely to be perceptible.    

## Roadmap

### Edge cases

Little arg validation is done - in some cases this produces unexpected behavior. Need to 
validate particularly numeric args like `take`

### A few more features

This is the only one common sequence method left to add (just haven't needed it yet..)

##### zip(other, fn)

Apply a function to the corresponding elements of two sequences; return the output of the function for each element.

### Typescript

I did a basic TypeScript conversion, but it doesn't actually work, and adds about 15% to the size anyway because of some optimizations that aren't directly possible with TS and Babel. But it's good enough to generate a typings file. 

I am working independently on a good jsdoc-to-d.ts converter to provide typings (generally) for non-typescript projects. Right now I am manually maintaining the typings file, which is a bad idea.

### Size Optimization

It's about 10K compressed/4k gzipped right now. There are opportunities for code reuse that I haven't taken advantage of that could further reduce the size of this library. I don't see it growing too much more, as I've arleady implemente pretty much every seqeunce operation I can think of.

## Similar Libraries

There are a bunch of them. It was actually pretty hard to find a good npm package name. :)
    
I had the following needs in mind when creating this:

* easy interop with `Array`, `Map`, `Set`, `immutable` library, and native Javascript objects
* complete support of `Array` API
* extended API for traversal, and set and group operations 
* good documentation
* small

All the similar packages I found missed on one or more of these points. 
