(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
var _iterator = Symbol.iterator;
var _p='prototype'
var arrProto = Array[_p];
 

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
        return; 
    } else if  (!(this instanceof Iter)) {
        // instantiation checking is only for public consumers, so we don't need to pass more than one argument
        return new Iter(source);
    }

    var iterator = source && source[_iterator];

    // it's allowed to construct with nothing,  but you can't construct with a non-iterable entity.
    if (!iterator && !(source == null)) {
        if (source && typeof source !== 'function') {
            return Iter.fromObjectOwn(source);
        }
        throw new Error('iter can only be sourced with an Iterable object or a regular Javascript object.');
    } 
    this[_iterator]=iterator ? iterator.bind(source) : emptyGenerator;
}


Object.assign(Iter, {
    /**
     * Produce an Iter instance from a generator
     * 
     * @param {generator} a function producing an iterator
     * @returns {Iter} an Iter instance
     */
    fromGenerator:  function(generator) {
        return new Iter(_iterator, generator);
    },
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
    reflect: getPropDescriptions,
    /**
     * Produce an iter instance using a callback to generate values, or repeating a single value
     */    
    generate: function(obj, times) {
        return new Iter(_iterator, function() {
            var index = -1;
            return {
                next: function() {
                    index++;
                    return iterResult(index >= times, (typeof obj === 'function' ? obj(index) : obj))
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
    orderDesc: function(order) {
        return orderBy.call(this, order, true)
    },
    thenBy: thenBy,
    thenDesc: function(order, desc) {
        return thenBy.call(this, order, desc)
    },
    count: makeAggregator('var r=0', 'r++'),
    skip: newIter(skipIterable),
    take: newIter(takeIterable),
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
    sequenceEqual: function(sequence, mapLeft, mapRight) {
        var iter = this[_iterator]();
        var otherIter = sequence[_iterator]();
        var mapLeftFn = getValueMapper(mapLeft)
        var mapRightFn = getValueMapper(mapRight)
        var cur;
        var otherItem;

        while(otherItem = otherIter.next(), !otherItem.done) {
            cur = iter.next();
            if (cur.done ||  mapRightFn(otherItem.value) !== mapLeftFn(cur.value)) return false; 
        }

        if (!iter.next().done) return false;
        return true;
    },
    concat: newIter(makeConcatIterator),
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
    some: makeAggregator('var i=0','if (a({v},b,i)) return true','return false'),
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
    lastIndexOf: makeAggregator('var r=-1, i=0', 'if ({v}===a) r=i; i++'),
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
        return this.skip(begin).take(end-begin+1);
    },
    reduce: makeAggregator('var r=b;var i=0', 'r=a(r,{v},i++)'),
    reduceRight: (function() {
        var reduceRight = makeAggregator('var r=b;var i=c', 'r=a(r,{v},i--)')

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
    min: makeGetkeyAggregator('var r=Infinity', 'var v = {v}; if (r>v) r=v'),
    /**
     * Return the maximum value in the sequence
     * 
     * @param {function} getkey An optional callback invoked on each element that returns the value to sum
     * @returns {any} The maximum value 
     */
    max: makeGetkeyAggregator('var r=-Infinity', 'var v = {v}; if (r<v) r=v'),
    /**
     * Return the sum of all elements in the sequence
     * 
     * @param {any} getkey An optional callback invoked on each element that returns the value to sum
     * @returns {any} The sum of all elements in the sequence (using the + operator)
     */
    sum: makeGetkeyAggregator('var r=0', 'r+={v}')
};

// These methods require traversing the entire array so just make them into an array
['sort', 'reverse'].forEach(function(method) {
    Iter[_p][method]=function() {
        var that = this;
        var args = arguments;
        return new Iter(_iterator, function() {
            var arr = that.toArray(); 
            return arrProto[method].apply(arr,args)[_iterator]();
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
 * Generate an aggregator function that is optimized for either doing a value transformation, or just using the value.
 * Using eval allows code reuse without a lot of extra function calls to do conditional logic during evaluations.
 * 
 * @param {any} setup
 * @param {any} aggregator
 * @param {any} getkey When true provides two implementations, one if there's a callback, one if not
 * @returns
 */
function makeAggregator(setup, aggregator, teardown, getkey) {
    return new Function('a', 'b', 'c', 'var _i=this[Symbol.iterator]();' +
        (setup || 'var r=-1') + ';' + 
        'var _c;'+
        (getkey ? 'if (a) while (_c = _i.next(), !_c.done) {' + aggregator.replace(/\{v\}/g, 'a(_c.value)') + ';} else ' : '') +
        'while (_c=_i.next(), !_c.done) {' + aggregator.replace(/\{v\}/g, '_c.value') + ';};' +  
        (teardown || 'return r'));
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
    var orders=[orProp(order)];
    return orderByHelper.call(this, this, orders, desc)
}

function thenBy(order, desc) {
    if (!this[_orders]) throw new Error("thenBy only makes sense after orderBy")
    var orders = this[_orders].slice(0);
    orders.push(orProp(order))
    return orderByHelper.call(this, this[_root], orders, desc)
}

function orderByHelper(root, orders, desc) {
    var seq =  new Iter(_iterator, makeOrderByIterator.call(this, orders, desc));
    seq[_orders] = orders;
    seq[_root] = root
    return seq;
}

function makeOrderByIterator(orders, desc){
    var that = this;

    return function() {
        
        var sorted = that.toArray().sort(function(a, b) {
            var val=0;
            for (var i=0; val===0 && i<orders.length; i++) {
                var fn = orders[i];
                var va = fn(desc?b:a);
                var vb = fn(desc?a:b);
                if (va<vb) val=-1
                else if (vb<va) val=1
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
         
        var iterator = that[_iterator]();
        var other = new Map(mapRight ? new Iter(sequence).groupBy(rightKeyMapper) : sequence)
        var matches;
        var leftValue;
        var id;
        
        
        return {
            
            next: function() {
                /*eslint no-constant-condition:0 */
                while (true) {
                    if (!matches) {
                        var left = iterator.next()

                        if (left.done) return doneIter()
                        id = leftKeyMapper(left.value)
                        leftValue = leftValueMapper(left.value);
                        var match = other.get(id)
                        if (!match || !match[_iterator] || typeof match === 'string') {
                            return { 
                                done: false, 
                                value: mergeFn(leftValue, match, id) 
                            }
                        }
                        matches = match[_iterator]() 
                    } 

                    // being here means the right is iterable
                    
                    var right = matches.next();
                    if (!right.done) {
                        return { 
                            done: false, 
                            value: mergeFn(leftValue, rightValueMapper(right.value), id)
                         }
                    } else {
                        matches = null;
                    }
                }
            }
        }        
    }
}

function skipIterable(n) {
    var that = this;
    return function() {
        var iterator = that[_iterator]()
        while (n-- > 0 && !iterator.next().done) ;
        return iterator;
    } 
}

function takeIterable(n) {
    var that = this;
    return function() {
        var iterator = that[_iterator]()
        return {
            next: function() {
                if (n !== 0) {
                    var cur = iterator.next();
                    if (!cur.done) {
                        n--;
                        return {
                            done: false,
                            value: cur.value
                        }
                    }
                }
                return doneIter()
            }
        }
    } 
}

function getNext(condition) {
    var sourceIter = this[_iterator]()
    var index = 0;
    return {    
        next: function() {
            var cur = sourceIter.next();
            while (!cur.done && !condition(cur, index++)) {
                cur = sourceIter.next();
            }
            return iterResult(cur.done, cur.value);
        }
    }
}


function makeObjectIterator(recurse, getters, obj, filter) {
    return function() {
        var data = getPropDescriptions(
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

        return {
            next: function() {
                var cur = sourceIter.next();
                return iterResult(cur.done, !cur.done && 
                    (cb.call(thisArg, cur.value, index++), cur.value))
            }
        }
    }
}

function makeExceptIterator(other, mapLeft, mapRight) {
    var that = this;
    return function() {
        var leftMapper = getValueMapper(mapLeft)
        var except = new Set(orMapSequence(mapRight, other))
        return getNext.call(that, function(cur) {return !except.has(leftMapper(cur.value)) })
    }
}

function makeIntersectIterator(other, mapLeft, mapRight) {
    var that = this;
    return function() {
        var leftMapper = getValueMapper(mapLeft)
        var intersect = new Set(orMapSequence(mapRight, other));
        return getNext.call(that, function(cur) { return intersect.has(leftMapper(cur.value)) })
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
        var iterator = that[_iterator]()
        var cur;
        var mapValue = getValueMapper(getkey);
        return {
            next: function() {
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
                return doneIter()
            }
        }
        
    }
}

function makeGroupByIterator(group) {
    var that = this;
    return function() {
        var cb = getValueMapper(group);
        var dict = new Map();
        
        var cur;
        var iterator = that[_iterator]()
        while (cur = iterator.next(), !cur.done) {
            var e = cur.value;
            var key = cb(e);
            if (dict.has(key)) {
                dict.get(key).push(e);
            } else {
                dict.set(key, [e]);
            }
        }

        return dict[_iterator]();
    }
}


function makeConcatIterator() {
    var that = this;
    var sources = [that].concat(arrProto.slice.call(arguments));
    return function() {       
        var index = 0;
        var iterator;
        return {
            next: function() {
                while (index < sources.length) {
                    
                    if (!iterator) {
                        var nextSource = sources[index]
                        iterator = typeof nextSource !== 'string' && nextSource[_iterator] ? 
                            nextSource[_iterator]() : 
                            objectAsGenerator(nextSource);
                    } 
                    
                    var cur = iterator.next();
                    if (!cur.done) {
                        return {
                            done: false,
                            value: cur.value
                        }                                        
                    } else {
                        iterator = null;
                        index++;
                    }
                }
                return doneIter();                
            }
        }        
    }
}

function makeFlattenIterator(recurse) {
    var that = this;
    return function() {
        var iterators = [that[_iterator]()];
        var iterator;
        return {
            next: function() {
                while (iterator || iterators.length > 0) {
                    if (!iterator) iterator = iterators.pop();
                    var cur = iterator.next();
                    if (cur.value && cur.value[_iterator] && typeof cur.value !== 'string' && (recurse || iterators.length === 0)) {
                        iterators.push(iterator);
                        iterator = cur.value[_iterator]();
                    } else {
                        if (!cur.done) {
                            return { done: false, value: cur.value }
                        } else {
                            iterator = undefined;
                        }
                    }
                }
                return doneIter();
            }
        }
    }
}

function makeFilterIterator(cb, thisArg) {
    verifyCb(cb)
    var that = this;
    return function() {
        var index = 0;
        var sourceIter = that[_iterator]()

        return {
            next: function() {
                
                var cur = sourceIter.next();
                while (!cur.done && !cb.call(thisArg, cur.value, index++)) {
                    cur = sourceIter.next();
                }
                return iterResult(cur.done, cur.value);
            }
        }
    }
}

function makeMapIterator(cb, thisArg) {
    verifyCb(cb)
    var that = this;
    return function() {
        var index = 0;
        var sourceIter = that[_iterator]();

        return {
            next: function() {
                var cur = sourceIter.next();
                return iterResult(cur.done, !cur.done && 
                    cb.call(thisArg, cur.value, index++))
            }
        }
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

function orProp(obj) {
    return typeof obj === 'function' ? 
        obj :
        function(e) {
            return e[obj];
        }
}

function iterResult(done, value) {
    if (!done) {
        return {
            value: value,
            done: false
        }
    } else {
        return doneIter()
    }
}

function doneIter() {
    return {
        done: true
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
 * Make a single element iterable
 * 
 * @param {any} e Any object
 * @returns {function} An iterator

 */
function objectAsGenerator(e) {
    var done = false;
    return { 
        next: function() {
            return done ? doneIter() : (done=true, { done: false, value: e })
        }
    }
}


/**
 * Helper for getPropDescriptions
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

function getPropDescriptions(obj, recurse, filter) {
    if (typeof recurse === 'function') {
        filter=recurse;
        recurse=false;
    }
    var props = getAllProps(obj, recurse);
    if (filter) {
        verifyCb(filter)
        props = props.filter(function(e) { return filter(e[0]) });
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
            getter: e.get || null,
            setter: e.set || null,
            configurable: e.configurable,
            enumerable: e.enumerable,
            depth: d[2]
        }];
    })
}

var Kvp=function(arr, value) {
    this[0]=value ? arr : arr[0];
    this[1]=value || arr[1];
};

['key','value'].forEach(function(prop, i) {
    Object.defineProperty(Kvp[_p], prop, {
        get: new Function('return this['+i%2+']')
    })
})

Object.assign(Kvp[_p], {
    toString:function() {
        return '['+this.key+','+this.value+']'
    },
    valueOf: function() {
        return this.key; 
    }
})

Iter.Kvp = Kvp;

module.exports = Iter


},{}]},{},[1]);
