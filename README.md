# iter8

A data transformation library that provides the familiar `Array` API plus extensions for use on JavaScript iterables.

## Why?

Iterators are a powerful new feature of ES6. ES6 `Set` and `Map` types offer some much needed support for basic data structures that support iterables directly. But, interop with arrays is inconvenient, and they lack native support for the most of the familiar array transformation methods.

`iter8` seeks to bridge the gap between arrays and iterables, leveraging native data structures and adding some useful new transformation functions. Internally, it handles everything as an immutable seqeunce, and defers all queries for non-value-producing operations. No work gets done until you ask for some specific output, and the sequence is only iterated as much as needed to perform your operations. 

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

Iter exports a single function/constructor. To use iter8, create a new instance:

```JavaScript
import iter from `iter8`
let x = iter(someArray)
```

Then you can use the API described below. Iter8 has two types of methods: *transformation* and *value-producing*.

*Transformation* methods return a new instance of `Iter` with a new sequence that's the result of your operation. *value-producing* methods return an element from the sequence or some computed value.

Execution of every query is deferred until a *value producing* method is called, which exports data outside the construct of an `Iter` object. If your query doens't need to iterate over the entire sequence, it won't. Each of these methods returns something other than an `Iter` object thus ending the chain and causing execution.

In addtion to these methods, some `Array` prototype methods are also value producing.

### Value-returning methods

#### execute()

Causes the query to be executed immediately, instead of waiting until a value-returning method is run. This is useful in cases where you want to keep your data in an `Iter` object, but cache an intermediate result for later use with other computations.

```Javascript
const intermediate = iter(something)
    .groupBy('category')
    .map([key, value]=>[key, iter(value.map(e=>e.amount).sum())]);

let group1 = intermediate.filter([category]=>category === 'category 1').as(Map)
let group2 = intermediate.filter([category]=>category === 'category 2').as(Map)
```

Without uising "execute" here, the "groupBy" etc. would be run twice for both `group1` and `group2` since execution of the entire query is deferred until a value-producing result, in this case `as(Map)`.

#### as(Type)

Creates an instance of `Type` using the sequence as a single constructor argument. This works well with the ES6 `Map` and `Set` types. You can also use `Array`, which is a special case, even though constructing an Array with an iterable doesn't work directly. You can use any user-defined types that can accept an iterable as a single constructor argument.

```Javascript
// make a lookup table returning all elements of the source grouped by the
// values of property `category`

let map = iter(something).groupBy('category').as(Map)
```

#### toArray()

Return an array created by iterating the sequence completely. Same as `as(Array)`

#### toObject()

Assuming the seqeunce contains *key-value pairs* and each key is unique, return an object with `{ property: value }` for each key-value pair.

This method makes no effort to validate the elemens in your sequence, rather, it just uses `value[0]` for each key and `value[1]` for each value. It is often useful in conjunction with `groupBy`, which returns a sequnce of key/value pairs, or when `iter` is created from a `Map` object. 

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

#### first()

Return the first element in the sequence. Same as `get(0)`

#### last()

Return the last element in the sequence

#### get(n)

Return the nth (0-based) element in the sequence

#### count()

Return the number of elements in the seqeunce.

```Javascript
let x = iter([1,2,3,4,5]).count()
// x === 5
```

#### min()

Return the minimum of all values in the seqeunce

```Javascript
let x = iter([3,1,2,4]).min()
// x===1
```

#### max()

Return the max of all values in the sequence

#### sum()

Return the sum of all values in the sequence

### Aggregation and transformation methods

These methods return a new sequence based on some transformation of the original one.

#### groupBy(group)

Return a sequence of `key-value pairs` (an array with two elements) where each key is a distinct group, and each value is an `Array` of all the elements from the original sequence in that group.


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

#### skip(n)

Skip `n` elements in the sequence

```Javascript
let x = iter([1,2,3,4,5]).skip(2).value   
// x === 3
```

#### take(n)

Subset the sequence to include only the next `n` elements.

```Javascript
let x = iter([1,2,3,4,5]).skip(1).take(2).toArray() 
// x === [2,3]
```

Since each step operates against a new sequence defined by the previous step, successive `take` operations might operate counterintunitively -- e.g. `x.take(3).take(2)` is *not* the same as `x.take(5)` -- rather it's the same as `x.take(2)`.

#### cast(Type)

Convert each element to in instance of `Type`. `Type` must be a constructor, and is invoked with the element as a single constructor argument for each element in the sequence.


### All non-destructive Array.prototype members

Every `Array` method that doesn't mutate the array is supported, and execution is deferred until the query is executed. The signatures are the same as the native versions, except arguments which pass the array itself to a callback are not implemented.

`length` is also explicitly not implemented. Instead see `count`, above. Since obtaining the number of elements in a sequence necessarily requires iterating the sequence, this is a method rather than a property.

#### forEach(callback, thisArg)

Unlike the native array `forEach`, this method has a return value of the sequence itself. It returns *the original sequence* -- not a new instance of `Iter`. This is because `forEach` cannot be used to transform values, but rather is used to cause side effects. So you can chain from `forEach`.

#### map(callback, thisArg)

#### filter(callback, thisArg)

#### concat(sequence, sequence, ...)

If non-iterable arguments are passed, they will be appended to the sequence as well.

#### slice(begin, end)

#### sort(callback)

#### reverse()

#### join(separator) *value-producing*

#### some(callback, thisArg) *value-producing*

#### every(callback, thisArg) *value-producing*

#### includes(callback, thisarg) *value-producing*

#### indexOf(value) *value-producing*

#### lastIndexOf(value) *value-producing*

#### findIndex(callback, thisArg) *value-producing*

#### find(callback, thisArg) *value-producing*

#### reduce(callback, initial) *value-producing*

#### reduceRight(callback, initial) *value-producing*


## Roadmap

### Missing methods

There are a few more interesting methods I'd like to implement that are pretty easy and will be in the next release:

#### takeWhile(callback)

Take elements as long as `callback(value)` is true

#### skipWhile

ditto

#### union

Return only unique elements resulting from merging another sequnce

#### except

Exclude elements found in another seqeuence

### Extensibility

Add an extension point for adding methods.

### Equality comparison

Some complex set operations are much more useful if a notion of equality comparison other than simply reference equality (e.g. `===`) can be used when performing the operation. In C# think of `getHashCode` and `equals`. There's a vague notion of this with `valueOf` in Javascript, but it doesn't work for direct comparisons, only relative ones (`<` and `>`). 

It would be nice to implement a convention such as `equals` which some operations will use to perform equality comparisons, if available.

### Performance

I haven't evaluated it at all. This has proven plenty fast for the use cases I've had so far, but I have no way to know if it is actually faster than simply iterating over entire arrays. I suspect "it depends" but I'd like to do some basic performance tests.

### Size Optimization

It's about 6K compressed right now. There are opportunities for code reuse that I haven't taken advantage of that could reduce the size of this library.

## Similar Libraries

There are a bunch of them. I only did this because I didn't find one that respected the familiar native `Array` methods universally, while adding simple iterable interop, with a simple, clean API. And also had decent documentation. So I wrote one.
