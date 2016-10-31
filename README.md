# iter8

A data transformation library that provides the familiar `Array` API plus extensions for use on JavaScript iterables.

## Why?

Iterators are a powerful new feature of ES6. ES6 `Set` and `Map` types offer some much needed support for basic data structures that support iterables directly. But, interop with arrays is inconvenient, and they lack native support for the most of the familiar array transformation methods.

`iter8` seeks to bridge the gap between arrays and iterables, leveraging native data structures and adding some useful new transformation functions. Internally, it handles everything as an immutable sequence, and defers all queries for non-value-producing operations. No work gets done until you ask for some specific output, and the sequence is only iterated as much as needed to perform your operations. 

## Installation 

    npm install --save iter8
    
## Usage

Wrap any iterable object with `iter(..)` and then use familiar `Array` methods for transformation. Some new transformation and traversal methods are also added, like `groupBy` and `flatten`. All evaluation is performed only when actual data is exposed via methods that return data, and it's all performed via iteration.

```Javascript
// someArray = [{active, id}]

const lookup = iter(someArray).
    .filter(e=>e.active)
    .map(e=>[e.id, e])
    .toArray();

const firstThree = lookup.take(3).toArray()  
const fourth = lookup.get(4)   // returns value of 4th id
```

I can already do that with in array.... so let's do some more interesting things:

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

let foodSales = money.get('food');
```

## API

Iter exports a single function. This is a constructor, so it can be used for `instanceof` tests, but you can also simply invoke it rather than using `new`. To use iter8, create a new instance from an iterable object:

```JavaScript
import iter from `iter8`
let x = iter(someArray)
```

Then you can use the API described below. Iter8 has two types of methods: *transformation* and *value-producing*.

*Transformation* methods return a new instance of `Iter` with a new sequence that's the result of your operation. *Value-producing* methods return a value.

Execution of every query is deferred until a *value producing* method is called, which exports data outside the construct of an `Iter` object. If your query doesn't need to iterate over the entire sequence, it won't. Each value-producing methods returns something other than an `Iter` object thus ending the chain and causing execution.

In addition to its own API, `Iter` implements method for all the `Array` prototype methods that don't mutate the array. Some of these are value-producing, such as `indexOf`, while some are transformation functions and produce a new sequence, such as `filter`.

*Note about key-value pairs:* When describing an element as a *key-value pair*, this always means an array with two elements: `[key, value]`. This is the data structure used by JavaScript `Map` objects, and is also used for many other operations by `Iter` such as iterating over objects (property-value), and grouping (groupname-members).

## Creating Iter objects

To create a new `Iter` from any iterable or plain JavaScript object, just:

```Javascript
let obj = iter([1,2,3]).filter(e=>e<3).toArray()
// [2,3]

```
JavaScript objects become sequences of `[key, value]` pairs:

```Javascript
let obj = iter({ foo: 'bar', fizz: 'buzz'}).toArray();
// [['foo', 'bar'], ['fizz', 'buzz]]
```

The default behavior is to enumerate own properties as well as the prototype chain. `constructor` is always ignored.

Key-value pairs make for easy interop with javascript `Map` objects, too:

```Javascript
let obj = iter({ foo: 'bar', fizz: 'buzz'}).as(Map);
// Map { 'foo' => 'bar', 'fizz' => 'buzz' }
```
### Static methods

In addition to the default construtor/factory function, you can call some specific construction helpers:

#### fromObject(obj, filter)

Create a new `Iter` of `[key, value]` pairs by enumerating properties on `obj` and its prototype chain. This accesses the same properties as `for ... in`, except ignores `constructor`.

You can pass a callback `filter(prop)` to filter properties. Returning `false` from the callback will exclude the property.

#### fromObjectOwn(obj, filter)

Create a new `Iter` of `[key,value]` pairs, ignoring the prototype chain. This accesses the same properties as `Object.keys`.  

You can pass a callback `filter(prop)` to filter properties. Returning `false` from the callback will exclude the property.

The default object creation behavior when passing an object directly to `iter` is the same as `Iter.fromObjectOwn(obj)` with no filter.

#### fromIterator(iterator)

You can create an `Iter` directly from an iterator or generator function:

```Javascript
function* gen() {
    yield 1;
    yield 2;
    yield 3;
}
let x = iter.fromIterator(gen).toArray()
/// x === [1,2,3]
```

### Value-returning methods

These methods all cause the query to execute and return some value or object.

#### first()

Return the first element in the sequence. Same as `get(0)`.

#### last()

Return the last element in the sequence.

#### get(n)

Return the nth (0-based) element in the sequence.

#### count()

Return the number of elements in the seqeunce.

```Javascript
let x = iter([1,2,3,4,5]).count()
// x === 5
```

#### min()

Return the minimum of all values in the seqeunce:

```Javascript
let x = iter([3,1,2,4]).min()
// x===1
```

#### max()

Return the max of all values in the sequence.

#### sum()

Return the sum of all values in the sequence.

#### toArray()

Return an array created by iterating the sequence completely. Same as `as(Array)`.

#### toObject()

Assuming the seqeunce contains *key-value pairs* and each key is unique, return an object with `{property: value}` for each key-value pair.

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

### Transformation methods

These methods return a new sequence based on some transformation of the original one. These include aggregation, traversal, and set operations. These are all chainable, and execution is always deferred. The seqeuence will only be iterated as much as necessary to perform a given transformation. Some methods will by nature always iterate over the entire sequence, such as set operations.

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

#### flatten()

For each element in the sequence, if the element is an array, return each element in the array as a new element in the sequence. Note that this is *not* recursive. Therefore if an element of the seqeunce is a seqeunce, and it contains an element that is *also* a sequence, the inner sequence will not be projected but just passed as-is. 

```Javascript
let x = iter([[1, [2,3], 4, [5,6,[7],8]]]).toArray()
// x === [1,2,3,4,5,6,[7],8]
// 7 remains an array because it's an element of the child array
```

#### unique()

Return a sequence containing only one element for each distinct value in the sequence

```Javascript
let x = iter([1,2,3,3,4,4,5,4,5]]).unique().toArray()
// x === [1,2,3,4,5]
```

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


#### do(callback, thisArg)

`do` is similar to `forEach` in that it simply invokes a callback for each element in the seqeunce. Unlike `forEach`, `do` ignores the return value, and so cannot be canceled. The output sequence is always identical to the input sequence.

`do` operates asynchronously, like every non-value-producing method, and so should not be used to immediately cause side effects like `forEach`. 


#### skip(n)

Skip `n` elements in the sequence

```Javascript
let seq = iter([1,2,3,4,5])
let x = seq.skip(2).value   
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

#### repeat(obj, n) 

Create a sequence of `obj` repeated `n` times

```Javascript
let x = iter([1]).repeat(2, 5).toArray() 
// x === [1,2,2,2,2,2]
```

#### cast(Type)

Convert each element to an instance of `Type`. `Type` must be a constructor, and is invoked with the element as a single constructor argument for each element in the sequence.

#### execute()

Though this is not a value-producing method, it causes the query to be executed immediately, instead of waiting until a value-returning method is run. This is useful in cases where you want to keep your data in an `Iter` object, but cache an intermediate result for later use with other computations.

```Javascript
const intermediate = iter(something)
    .groupBy('category')
    .map([key, value]=>[key, iter(value.map(e=>e.amount).sum())])
    .execute();

let group1 = intermediate.filter([category]=>category === 'category 1').as(Map)
let group2 = intermediate.filter([category]=>category === 'category 2').as(Map)
```

Without using "execute" here, the "groupBy" etc. would be run twice for both `group1` and `group2` since execution of the entire query is deferred until a value-producing result, in this case `as(Map)`.

### All non-destructive Array.prototype members

Every `Array` method that doesn't mutate the array is supported, and execution is deferred until the query is executed. The signatures are the same as the native versions, except arguments which pass the array itself to a callback are not implemented.

The `length` property of arrays is also explicitly not implemented. Instead see `count`, above. Since obtaining the number of elements in a sequence necessarily requires iterating over the entire sequence, this is a method rather than a property.

#### forEach(callback(e, i), thisArg) 

`forEach` executes the query immediately, and always returns `undefined`. If you want to cause side effects during normal sequence processing, use `do` instead.

`forEach` can be aborted by returning `false` from the callback. Any other return values are ignored. If `false` is returned, the rest of the sequence will not be iterated.

```Javascript
// log 'message' for all but the first 3 elements in the sequence
iter(arr).skip(3).forEach((e)=> {
    console.log(e.message)
});
```

#### map(callback(e, i), thisArg)

Transform each element.

#### filter(callback(e, i), thisArg)

Filter elements.

#### concat(sequence, sequence, ...)

Return a new sequence composed of the original sequence, followed by each element it the other sequences passed as arguments. If non-iterable arguments are passed, they will be appended to the sequence as well.

#### slice(begin, end)

Return a subset of the original sequence. `skip` and `take` will do the same thing, and may be more expressive, but `slice` is supported fo completeness. Negative values for "begin" not currently supported (todo for api compatibility)

#### sort(callback(a, b))

Sort the sequence. 

#### reverse()

Reverse the order of the seqeuence

#### join(separator) *value-producing*

#### some(callback(e, i), thisArg) *value-producing*

#### every(callback(e, i), thisArg) *value-producing*

#### includes(value) *value-producing*

#### indexOf(value) *value-producing*

#### lastIndexOf(value) *value-producing*

#### findIndex(callback(e, i), thisArg) *value-producing*

#### find(callback(e, i), thisArg) *value-producing*

#### reduce(callback(last, current, i), initial) *value-producing*

#### reduceRight(callback(last, current, i), initial) *value-producing*


## Roadmap

### Construct from object enhancements

Right now property getters are never enumerated, need to add this option. 

### Missing methods

There are a few more interesting methods I'd like to implement that are pretty easy and will be in the next release:

#### takeWhile(callback)

Take elements as long as `callback(value)` is true

#### skipWhile

ditto

#### union(other)

Return only unique elements resulting from merging another sequence

#### sequenceEqual(other)

Determine if two sequences are equal

#### zip(other, fn)

Apply a function to the corresponding elements of two sequences; return the output of the function for each element.

#### other method enhancements

* Add a "map" callback as an optional argument for sum, min, max methods (most common use case: sum values of a property)
* Update documentation to discuss "undefined" as return value for value-producing methods that have empty seqeuences as input
* firstOrDefault, lastOrDefault

Exclude elements found in another sequence

### Extensibility

Add an extension point for adding methods.

### Equality comparison

Some complex set operations are much more useful if a notion of equality comparison other than simply reference equality (e.g. `===`) can be used when performing the operation. In C# think of `getHashCode` and `equals`. There's a vague notion of this with `valueOf` in Javascript, but it doesn't work for direct comparisons, only relative ones (`<` and `>`). 

It would be nice to implement a convention such as `equals` which some operations will use to perform equality comparisons, if available.e

### Performance

I haven't evaluated it at all. This has proven plenty fast for the use cases I've had so far, but I have no way to know if it is actually faster than simply iterating over entire arrays. I suspect "it depends" but I'd like to do some basic performance tests.

### Size Optimization

It's about 6K compressed right now. There are opportunities for code reuse that I haven't taken advantage of that could reduce the size of this library.

## Similar Libraries

There are a bunch of them. I only did this because I didn't find one that respected the familiar native `Array` methods universally, while adding simple iterable interop, with a simple, clean API. And also had decent documentation. So I wrote one.
