/**
 * iter8 - an iteration utility library
 * Author: James Treworgy
 * License: MIT
 * 
 * The jsdoc in this file may not be maintained; please see `index.d.ts` for current method documentation.
 */
  

var _orders = Symbol();
var _root = Symbol();
var _args = Symbol();
var _op = Symbol();
var _open = Symbol();
var _iterator = Symbol.iterator;
var _get = Symbol();
var _done = Symbol();
var _p='prototype'
var arrProto = Array[_p];

/*var hasForOf = (function() {
    try {
        new Function('for (var x of []);')
    } catch(e) {
        return false;
    }
    return true;
}())
*/

/**
 * When invoked from the public, on the first arg matters. If the first arg is [Sybmol.iterator]
 * then it cann accept to more arguments for use in chaining additional clauses
 * 
 * @param {any} source An iterable, or [Symbol.iterator]
 * @param {any} generator A generator, OR a special case function (when "root" and "args" are passed)
 * @param {any} args The arguments to the root operation
 * @param {any} root The root "iter" object for chained operations
 */
function Iter(source, generator, root, args) {

    if (source === _iterator) {
        if (!root) {
            this[_iterator] = generator;
        } else {
            this[_iterator] = generator.apply(root, args)        
            this[_op] = generator;
            this[_root] = root
            this[_args] = args
        }
        this[_open] = []
        return; 
    } else if (!(this instanceof Iter)) {
        // instantiation checking is only for public consumers, so we don't need to pass more than one argument
        return new Iter(source, generator);
    }

    var iterable = source && (
        typeof source.next === 'function' ? 
            iteratorToGenerator(source) : 
            typeof source === 'function' ? 
                source : source[_iterator]
        );

    // it's allowed to construct with nothing,  but you can't construct with a non-iterable entity.
    if (!iterable && !(source == null)) {
        throw new Error('iter can only be constructed with an iterable, iterator or generator. Use "fromObject" of your intent is to enumerate object properties.');
    }

    // experimental: default iterator for Arrays seems much slower than making our own in some
    // circumstances. May substitute this if can figure out when it's better

    // if (iterator && Array.isArray(source) && generator===true) {
    //     this[_iterator]=function() {
    //         var i=0;
    //         var length = source.length;
    //         var arr = source
    //         return {
    //             next: function() {                    
    //                 return  {
    //                     done: i>=length,
    //                     value: source[i++]
    //                 }
    //             }
    //         }            
    //     }
    //     return;
    // }

    this[_iterator] = iterable ? iterable.bind(source) : emptyGenerator;
    this[_open] = []
}

Object.assign(Iter, {
    /**
     * Produce an iter instance from an object including its prototype
     * 
     * @param {object} a javascript object
     * @returns {Iter} an Iter instance
     */
    fromObject: newIter(makeObjectIterator, 2, [1,0]/*true,false*/),
    /**
     * Produce an iter instance from an object's own properties
     */
    fromObjectOwn: newIter(makeObjectIterator, 2, [0,0] /*false,false */),
    /**
     * Get metadata about the properties, and optionally the prototype chain, of an object
     *  
     * @param {object} object The object to refelect
     * @param {boolean} recurse If true, recurse prototype chain
     * @param {function} filter A callback invoked for each property name that should return true to include it, or false to exclude it
     * @returns {Array} An array of [key, value] pairs where the key is the prop name, and the value is the prop descriptor
     */
    reflect: reflect,

    /**
     * Produce an iter instance using a callback to generate values, or repeating a single value.
     * 
     * @param {(index: number)=>any | any} object A function or object
     * @param {number} The number
     * @returns {Iter} an iter object
     */
    generate: function(object, times) {
        var gen = typeof object === 'function' ? object : function() { return object }
        return new Iter(_iterator, function() {
            var index = -1;
            times = times || 1;
            return {
                next: function() {
                    index++;
                    return {
                        done: index >= times, 
                        value: index < times && gen(index) 
                    }
                }
            } 
        });
    },
});

Iter[_p] = {
    constructor: Iter,
    /**
     * forEach is the same as do(), but executes the query immediately.
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {void} 
     */
    forEach: makeAggregator('var i=0','a.call(b,{v},i++)',';'),
    /**
     * Execute a callback for each element in the seqeunce, and return the same
     * element. 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} a seqeunce identical to the input sequence 
     */
    do: newIter(makeDoIterator),
    groupBy: newIter(makeGroupByIterator),
    orderBy: orderBy,
    orderByDesc: function(order) {
        return orderBy.call(this, order, true)
    },
    thenBy: thenBy,
    thenByDesc: function(order) {
        return thenBy.call(this, order, true)
    },
    count: makeAggregator('var r=0', 'r++'),
    skip: newIter(function(n) {
        return skipWhileIterable.call(this, function() {
            return n-- !== 0;
        })
    }),
    skipWhile: newIter(skipWhileIterable),
    take: newIter(function(n) {
        return takeWhileIterable.call(this, function() {
            return n-- !== 0;

        })
    }),
    takeWhile: newIter(takeWhileIterable),
    cast: function(Type) {
        return new Iter(_iterator, makeMapIterator.call(this, function(e) {
            return new Type(e);
        }));
    },
    first: makeAggregator('var r=a','return {v}','return r'),
    last: makeAggregator('var r=a,l','r={v}'),
    flatten: newIter(makeFlattenIterator),
    /**
     * Return only unique elements in the seqeunce, using an optional key selector to 
     * identify uniqueness.
     * 
     * @param {function} cb The callback(element, index)
     * @param {key} key The id selector function or property (optional)
     * @returns {Iter} the new seqeunce 
     */
    unique: newIter(makeUniqueIterator),
    /**
     * Return all elements in the sequence that are not in the other sequence
     * 
     * @param {function} cb The callback(element, index)
     * @param {key} key The id selector function or property (optional)
     * @returns {Iter} the new seqeunce 
     */
    except: newCachedIter(makeExceptIterator,1),
    intersect: newCachedIter(makeIntersectIterator,1),
    union: newCachedIter(makeUnionIterator, 1),
    leftJoin: newCachedIter(makeLeftJoinIterator, 2),
    on: function(mapLeft, mapRight) {
        if (arguments.length === 1) mapRight = mapLeft;
        if (!this[_root]) throw new Error('"on" make no sense without a prior join or set merge operation.')
        return new Iter(_iterator, this[_op].apply(this[_root], this[_args].concat([mapLeft, mapRight])))
    },
    /**
     * Test whether two seqeunces are equal, meaning they are the same lengths and 
     * each item at the same position in each sequence is equal.
     *
     * @param {Iterable<any>} sequence the other sequence to test
     * @param {(item: any)=>any} keyLeft a function that returns a key from the original or "left" sequence
     * @param {(item: any)=>any} keyRight a function that returns a key from the other or "right" sequence
     * @returns {boolean} `true` if equal, `false` if not
     */
    sequenceEqual: function(sequence, keyLeft, keyRight) {
        var iter = getIterator(this);
        var otherIter = getIterator(sequence);
        var mapLeftFn = getValueMapper(keyLeft)
        var mapRightFn = getValueMapper(keyRight)
        var cur;
        var otherItem;

        while(otherItem = otherIter.next(), !otherItem.done) {
            cur = iter.next();
            if (cur.done || mapRightFn(otherItem.value) !== mapLeftFn(cur.value)) 
                return closeIter([!cur.done && iter, otherIter]), false;
        }

        return iter.next().done ? true : closeIter([iter]) || false;
    },
    keys: function() {
        return this.map(checkFirstMapper(0, ensureKvp));
    },
    values: function() {
        return this.map(checkFirstMapper(1, ensureKvp));
    },
    /**
     * Append each argument or each item in each argument that is a sequence to 
     * the current sequence
     * 
     * @returns {Iter} a new seqeunce
     */
    concat: function(/*...args*/) {
        return new Iter([this].concat(arrProto.slice.call(arguments))).flatten()
    },
    /**
     * Return a single element that is the return value of a function invoked for 
     * each element in the input sequence 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A transformed sequence 
     */    
    map: newIter(makeMapIterator),
    /**
     * Filter elements according to the callback's return value (false to exclude) 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A filtered sequence 
     */    
    filter: newIter(makeFilterIterator),
     /**
     * test whether some elements in the sequence match the condition
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @returns {boolean} true if any elements match the condition
     */
    some: makeAggregator('var i=0','if (a({v},b,i++)) return true','return false'),
     /**
     * test whether every element in the sequence matches the condition
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @returns {boolean} true if all elements match the condition
     */
    every: makeAggregator('var i=0','if (!a({v},b,i++)) return false','return true'),
    /**
     * test whether the element appears in the sequence
     * 
     * @param {any} element the element to locate
     * @returns {boolean} true if the value is found
     */    
    includes: makeAggregator('var i=0', 'if ({v}===a) return true; i++', 'return false'),
    /**
     * return the index of the element
     * 
     * @param {any} element The element to locate
     * @returns {number} The index or -1
     */
    indexOf: makeAggregator('var i=0', 'if ({v}===a) return i; i++', 'return -1'),
    /**
     * return the last index of the element
     * 
     * @param {any} element The element to locate
     * @returns {number} The index or -1
     */
    lastIndexOf: makeAggregator('var r=-1,i=0', 'if ({v}===a) r=i; i++'),
    /**
     * return the index of the element identified by a callback
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @returns {number} The index or -1
     */
    findIndex: makeAggregator('var i=0','if (a.call(b,{v},i)===true) return i; i++','return -1'),
    /**
     * return the element identified by a callback
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @param {default} object the value to return if the index isn't found (or `undefined` if omitted
     * @returns {number} The index or `undefined` 
     */
    find: makeAggregator('var i=0','if (a.call(b,{v},i++)===true) return {v};','return c'),
    get: makeAggregator('var i=0','if (i++===a) return {v}','return c'), 
    
    slice: function(begin, end) {
        // when end is missing, take gets NaN as an arg, and takes everything
        return this.skip(begin).take(end-begin);
    },
    reduce: makeAggregator('var r=b,i=0', 'r=a(r,{v},i++)'),
    reduceRight: (function() {
        var reduceRight = makeAggregator('var r=b,i=c', 'r=a(r,{v},i--)')

        return function(callback, initial) {
            var reversed = this.toArray().reverse();
            return reduceRight.apply(reversed, [callback, initial, reversed.length-1]);
        }  
    })(),
    join: function(separator) {
        return this.toArray().join(separator);
    },
    toObject: makeAggregator('var r={}','r[{v}[0]]={v}[1]'),
    toArray: makeAggregator('var r=[]','r.push({v})'),
    as: function(Cotr) {
        if (Cotr === Array) {
            return this.toArray();
        }
        return new Cotr(this);
    },
    /**
     * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
     * as in Iter object for further processing.
     * 
     * @returns {Iter} a new Iter object
     */
    execute: function() {
        return new Iter(this.toArray());
    },
    /**
     * Return the minimum value in the sequence
     * 
     * @param {function} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The minimum value 
     */
    min: makeGetkeyAggregator('var r=Infinity', 'if (r>{v}) r={v}'),
    /**
     * Return the maximum value in the sequence
     * 
     * @param {function} getkey An optional callback invoked on each element that returns the value to sum
     * @returns {any} The maximum value 
     */
    max: makeGetkeyAggregator('var r=-Infinity', 'if (r<{v}) r={v}'),
    /**
     * Return the sum of all elements in the sequence
     * 
     * @param {any} getkey An optional callback invoked on each element that returns the value to sum
     * @returns {any} The sum of all elements in the sequence (using the + operator)
     */
    sum: makeGetkeyAggregator('var r=0', 'r+={v}'),
    mean: makeGetkeyAggregator('var r=0,i=0', 'r+={v};i++', 'return r/i')
};

/**
 * Get an iterator from an iterable, with guards
 * 
 * @param {any} obj
 * @returns {Iterator} an iterator
 */
Iter[_p][_get] = getIterator;

/**
 * Return a "done" iterator value, and reset open iterators
 */
Iter[_p][_done] = doneIter;

function doneIter() {
    if (this) this[_open] = [];
    return {
        done: true
    }
}

function getIterator(obj) {
    if (typeof obj[_iterator] !== 'function') {
        throw new Error('The entity was not a valid iterable. It must implement [Symbol.iterator]')        
    }
    var iterator = obj[_iterator]();
    
    if (this) this[_open].push(iterator);

    if (typeof iterator.next !== 'function') {
        throw new Error('The iterable did not return a valid iterator.')
    }
    return iterator;
}


function deferReturn(arr) {
    return function() {
        closeIter(arr)
    }
}

function closeIter(iterators) {
    while (iterators.length > 0) {
        var e = iterators.pop();
        if (e && typeof e.return === 'function') {
            e.return();
        }
    }
}


// These methods require traversing the entire array so just make them into an array
['sort', 'reverse'].forEach(function(method) {
    Iter[_p][method]=function() {
        var that = this;
        var args = arguments;
        return new Iter(_iterator, function() {
            var arr = that.toArray(); 
            return arrProto[method].apply(arr,args)[_iterator]()
        });
    }
})

/**
 * Create a function that returns an Iter based on the generator.
 * `nargs` specifies the number of args from the original function
 * call to pass on to the generator function. This may be important
 * if the generator accepts more arguments internally than you want 
 * to expose to the public method.
 */
function newIter(generator, nargs, args) {
    return function() {
        return new Iter(_iterator, generator.apply(this, (args || [])
            .concat(arrProto.slice.call(arguments,0,nargs || undefined))));
    }
}

function newCachedIter(generator, nargs) {
    return function() {
        return new Iter(_iterator, generator, this, arrProto.slice.call(arguments, 0, nargs));
    }
}

/**
 * Create a value mapper that type checks the first element of a sequence only
 * 
 * @param {any} key A mapper (string, or function)
 * @param {function} check A function that throws an error if its arg is invalid 
 */
function checkFirstMapper(key, check) {
    var mapper = function(item) {
        mapper = getValueMapper(key);
        var val = mapper(item);
        check(val);
        return val;
    }
    return function(item) {
       return mapper(item)
    }
}

/**
 * Generate an aggregator function that is optimized for either doing a value transformation, or just using the value.
 * Using eval allows code reuse without a lot of extra function calls to do conditional logic during evaluations.
 * 
 * @param {any} setup
 * @param {any} aggregator
 * @param {any} getkey When true provides two implementations, one if there's a callback, one if not
 * @returns
 */
function makeAggregator(setup, aggregator, teardown, getkey) {
    var iterMethod = 'while (_c=_i.next(),!_c.done)';
    var valueAccessor ='_c.value';

    var loop = (getkey ? 'if (a) ' + iterMethod + ' {' + 
        aggregator.replace(/\{v\}/g, 'a(' + valueAccessor +')') +  
    ';} else ' : '') +

    iterMethod + '{' + 
        aggregator.replace(/\{v\}/g, valueAccessor) +  
    ';};';

    var fn = new Function('a', 'b', 'c', 'g', 
        'var _i=g(this);var _c;' + setup + ';' +
        loop +  
        (teardown || 'return r'));
    
    // passing getIterator in without context causes it to not cache anything as open.
    // aggregators are always iterated completely

    return function(a,b,c) {
        return fn.call(this,a,b,c, getIterator)
    }
}

/**
 * Wrap it wtih automatic "getkey" argument handling
 * 
 * @param {any} setup
 * @param {any} aggregator
 * @returns
 */
function makeGetkeyAggregator(setup, aggregator, teardown) {
    var aggregatorFn = makeAggregator(setup, aggregator, teardown, true)
    return function(getkey) {
        var mapfn = getkey && getValueMapper(getkey);
        return aggregatorFn.apply(this, [mapfn].concat(arrProto.concat.call(arguments)))
    }
}

function orderBy(order, desc) {
    var orders=[{ 
        fn: getValueMapper(order), 
        desc: desc
    }];
    return orderByHelper(this, orders)
}

function thenBy(order, desc) {
    if (!this[_orders]) throw new Error("thenBy only makes sense after orderBy")
    var orders = this[_orders].slice(0);
    orders.push({ 
        fn: getValueMapper(order), 
        desc: desc 
    })
    return orderByHelper(this[_root], orders)
}

function orderByHelper(root, orders) {
    var seq =  new Iter(_iterator, makeOrderByIterator(root, orders));
    seq[_orders] = orders;
    seq[_root] = root
    return seq;
}

function makeOrderByIterator(that, orders) {

    return function() { 
        var sorted = that.toArray().sort(function(a, b) {
            var val=0;
            var i=0; 
            for (var i=0; val === 0 && i<orders.length; i++) {
                var va=orders[i].fn(a);
                var vb=orders[i].fn(b);
                val = ((va < vb) ? -1 : ((va > vb) ? 1 : 0)) * (orders[i].desc ? -1 : 1);
            }
            return val;
        });
        
        return sorted[_iterator]();
    }
}

/**
 * Create a left-join iterator. Fully iterates the sequence on the right.
 * 
 * @param {iterable} The right side seqeunce
 * @param {any} onMap [fn, fn] array of functions to generate keys for the join
 * @returns {iterable} A new sequence
 */
function makeLeftJoinIterator(sequence, mergeFn, mapLeft, mapRight) {
    var that = this;
    return function() {
        var useKvps = !mapLeft && !mapRight;

        // create transform functions for the join. If neither mapper functions are provided,
        // the default behavior is to treat both sequences as KVP lists.
        // if not, then get a function using the default "map provider" behavior of either
        // using a provided function, or treating the value as a property name.

        var leftKeyMapper = getValueMapper(useKvps ? 0 : mapLeft)
        var leftValueMapper = getValueMapper(useKvps ? 1 : null)
        var rightKeyMapper = getValueMapper(useKvps ? 0 : mapRight)
        var rightValueMapper = getValueMapper(useKvps ?  1 : null)
        
        // in this method, we use getIterator directly b/c we don't want it to cache open iterators; we have
        // complicated inner state so we do it ourselves before each return

        var iterator = getIterator(that);
        var other = new Map(mapRight ? new Iter(sequence).groupBy(rightKeyMapper) : sequence)
        var matches;
        var leftValue;
        var id;
        var deferReturn;

        return withReturn(function() {
                /*eslint no-constant-condition:0 */
            while (true) {
                if (!matches) {
                    var left = iterator.next()

                    if (left.done) return that[_done]()

                    id = leftKeyMapper(left.value)
                    leftValue = leftValueMapper(left.value);
                    var match = other.get(id)
                    if (!match || !match[_iterator] || typeof match === 'string') {
                        this[_open] = [iterator]
                        return { 
                            done: false, 
                            value: mergeFn(leftValue, match, id)
                        }
                    }
                    matches = getIterator(match) 
                } 

                // being here means the right is iterable
                
                var right = matches.next();
                if (!right.done) {
                    this[_open] = [iterator, matches]
                    return { 
                        done: false, 
                        value: mergeFn(leftValue, rightValueMapper(right.value), id)
                    }
                } else {
                    matches = null;
                }
            }
        });
    }
}

/**
 * Generate an iterable response using either the stateful list of open iteratables, or the one passed in.
 */
function withReturn(next) {
    var that = this;
    return {
        next: next,
        return: function() {
            return deferReturn[that[_open]]()
        }
    }
}

function skipWhileIterable(cb) {
    var that = this;
    return function() {
        var iterator =  that[_get](that)
        
        // Explanation: on first next(), it will perform the full skip, and return the value, and replace
        // it's own implementation with a new iterable based on the remaining sequence. "return" is handled
        // on the initial value by exposing the "return" from the underlying iterator, and later by nature
        // of converting the remaining iterator to a new Iter which automatically exposes it to the consumer.

        var result = withReturn(function() {
            var cur;
            while (cur=iterator.next(), !cur.done && cb(cur.value));
            if (!cur.done) {
                // create a new iterator from the remainder so that 
                // return() gets handled correctly
                result = new Iter(iterator)()
                return {
                    value: cur.value,
                    done: false
                }
            }
            return that[_done]()
        });
    }
}

function takeWhileIterable(cb) {
    var that = this;
    return function() {
        var iterator = that[_get](that)
        return withReturn(function() {
            var cur = iterator.next();
            if (!cur.done && cb(cur.value)) {
                return { 
                    done: false, 
                    value: cur.value 
                }
            }
            return that[_done]()
        })
    } 
}


function makeObjectIterator(recurse, getters, obj, filter) {
    return function() {
        var data = reflect(
            obj,
            recurse,
            function(e) { return e!=='constructor' && (!filter || filter(e)) }
        )

        if (!getters) data = data.filter(function(e) {return e[1].field });

        data = data.map(function(e) { return [e[0], obj[e[0]]] })
        return data[_iterator]()
    }
}

function makeDoIterator(cb, thisArg) {
    verifyCb(cb)
    var that = this;
    return function() {
        var index = 0;
        var sourceIter = that[_iterator]()

        return withReturn(function() {
            var cur = sourceIter.next();
            !cur.done && cb.call(thisArg, cur.value, index++)
            return cur.done ? that[_done]() : cur
        })
    }
}

function makeExceptIterator(other, mapLeft, mapRight) {
    var that = this;
    return function() {
        var leftMapper = getValueMapper(mapLeft)
        var except = new Set(orMapSequence(mapRight, other))

        var sourceIter = that[_get](that)
        var cur
        return withReturn(function() {
            while (cur = sourceIter.next(), 
                !cur.done && except.has(leftMapper(cur.value)))
                    ;
         
            return cur.done ? that[_done]() : cur;
        })
    }
}

function makeIntersectIterator(other, mapLeft, mapRight) {
    var that = this;
    return function() {
        var leftMapper = getValueMapper(mapLeft)
        var intersect = new Set(orMapSequence(mapRight, other));
        var sourceIter = that[_get](that)
        var cur
        return withReturn(function() {
            while (cur = sourceIter.next(), 
                !cur.done && !intersect.has(leftMapper(cur.value)))
                ;
            return cur.done ? that[_done]() : cur;
        })
    }
}

function makeUnionIterator(other, mapLeft, mapRight) {
    var that = this;
    return function() { 
        var extra = new Iter(other).except(that);
        if (mapLeft || mapRight) extra = extra.on(mapLeft, mapRight)
        return that.concat(extra)[_iterator]()
    }    
}

function makeUniqueIterator(getkey) {
    var that = this;
    return function() {
        var used = new Set();
        var iterator = that[_get](that)
        var cur;
        var mapValue = getValueMapper(getkey);
        return withReturn(function() {
            while (cur = iterator.next(), !cur.done) {
                var value = mapValue(cur.value)
                if (!used.has(value)) {
                    used.add(value)
                    return {
                        done: false,
                        value: cur.value
                    }
                }
            }
            return that[_done]()
        });
    }
}

/**
 * Group using the group key argument, and optionally transforming the input
 * into the output array
 * 
 * @param {any} group
 * @param {any} transform
 * @returns
 */
function makeGroupByIterator(group, transform) {
    var that = this;
    return function() {
        var cb = getValueMapper(group);
        var trans = getValueMapper(transform)
        var dict = new Map();
        
        var cur;

        // using getIterator directly - we always iterate completely with groupBy
        
        var iterator = getIterator(that)
        while (cur = iterator.next(), !cur.done) {
            var key = cb(cur.value);
            (dict.get(key) || dict.set(key,[]).get(key))
                .push(trans(cur.value))
        }

        return getIterator(dict);
    }
}

function makeFlattenIterator(recurse) {
    var that = this;
    return function() {
        var iterators = [that[_iterator]()];
        var iterator;
        
        return withReturn(function() {
            while (iterator || iterators.length > 0) {
                if (!iterator) iterator = iterators.pop();
                var cur = iterator.next();
                if (cur.value && cur.value[_iterator] && typeof cur.value !== 'string' && (recurse || iterators.length === 0)) {
                    iterators.push(iterator);
                    iterator = cur.value[_iterator]();
                } else {
                    if (!cur.done) {
                        this[_open]=[iterator]
                        return { 
                            done: false, 
                            value: cur.value
                        }
                    } else {
                        iterator = undefined;
                    }
                }
            }
            return that[_done]();
        });
    }
}

function makeFilterIterator(cb, thisArg) {
    verifyCb(cb)
    var that = this;
    return function() {
        var index = 0;
        var sourceIter = that[_get](that)

        return withReturn(function() {
   
            var cur = sourceIter.next();
            while (!cur.done && !cb.call(thisArg, cur.value, index++)) {
                cur = sourceIter.next();
            }

            return cur.done ? that[_done]() : cur;
        })
    }
}

function makeMapIterator(key, thisArg) {
    var mapFn = getValueMapper(key)
    var that = this;
    return function() {
        var index = 0;
        var sourceIter = that[_get](that);

        return withReturn(function() {
            var cur = sourceIter.next();
            
            return cur.done ? that[_done]() : {
                done: false,
                value: mapFn.call(thisArg, cur.value, index++)
            }
        })
    }
}

function orMapSequence(mapFn, iterable) {
    return !(mapFn==null) ? 
        new Iter(iterable).map(getValueMapper(mapFn) ) :
         iterable; 
}

/**
 * Given a mapFn which can be missing, a function, or something else (probably
 * a string) that identifies a property, return a transformation function
 * 
 * @param {any} mapFn The map function or property
 * @returns A map function
 */
function getValueMapper(mapfn) {
    if (mapfn==null) {
        return function(value) { 
            return value 
        }
    } else if (typeof mapfn === 'function') {
        return mapfn
    } else {
        return function(value) {
            return value[mapfn];
        } 
    }
    
}
/**
 * An empty iterable
 * 
 * @returns {function} An iterator
 */
function emptyGenerator() {
    return function() {
        return {
            next: function() {
                return doneIter()
            }
        }
    }
}

function verifyCb(cb) {
    if (typeof cb !== 'function') throw new Error('The callback argument was not a function.')
}

/**
 * Helper for reflect
 * 
 * @param {any} obj
 * @param {any} recurse
 * @param {number} [depth=0]
 * @returns
 */
function getAllProps(obj, recurse, depth) {
    depth = depth || 0;
    // only get prop/owner pairs first, to avoid reflecting on everything deep in the chain that may be overridden

    var props = new Iter(Object.getOwnPropertyNames(obj)).map(function(e) {return [e, obj, depth] }).execute() 
    
    if (recurse) {
        var parentProto = Object.getPrototypeOf(obj)
        if (parentProto !== Object.prototype) {
            props = props
                .union(getAllProps(parentProto, true, depth+1))
                .on('0')
        }
    }

    return props;
} 

function reflect(obj, recurse, filter) {
    if (typeof recurse === 'function') {
        filter=recurse;
        recurse=false;
    }
    var props = getAllProps(obj, recurse);
    if (filter) {
        verifyCb(filter)
        props = props.filter(function(e, i) { return filter(e[0], i) });
    }

    return props.map(function(d) {
        var e = Object.getOwnPropertyDescriptor(d[1], d[0])
        var hasValue = e.hasOwnProperty('value') 
        return [d[0], {
            type: !hasValue ? null : 
                e.value === null ? 'null' : 
                typeof e.value, 
            field: hasValue,
            writable: !!e.writable || !!e.set, 
            get: e.get,
            set: e.set,
            configurable: e.configurable,
            enumerable: e.enumerable,
            depth: d[2]
        }];
    })
}


/**
 * Given an iterator (e.g. something with a "next()" function) convert it to a function that returns
 * same iterator reproducibly by caching the value from each invocation, and returning the cached value
 * if the iterator is recreated.
 * 
 * This allows basically recreating a generator from an iterator, and creating a reproducible sequence
 * from the iterator. 
 */
function iteratorToGenerator(iterator) {
    var arr = [];
    var cur = {};
   
   function returnFn() {
        closeIter([iterator])
    }
    
    return function() {
        var index = 0;
        
        return { 
            next: function() {
                if (!cur.done && index === arr.length) {
                    cur = iterator.next();
                    if (cur.done) return doneIter();
                    arr[index]=cur.value;
                }

                return index < arr.length ? {
                    value: arr[index++],
                    done: false
                } : doneIter();
            },
            return: returnFn
        }
    }
}


function ensureKvp(obj) { 
    if (!obj || (!obj.hasOwnProperty(0) && obj.hasOwnProperty(1) && obj.length === 2)) {
        throw new Error('The object was not a key-value pair, e.g. a 2-element array')
    }
}

module.exports = Iter

