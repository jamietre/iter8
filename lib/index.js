/**
 * iter8 - an iteration utility library
 * Author: James Treworgy
 * License: MIT
 * 
 * The jsdoc in this file may not be maintained; please see `index.d.ts` for current method documentation.
 */

'use strict'
  
var _s = Symbol;

var _iterator = _s.iterator;
var _orders = _s();
var _root = _s();
var _args = _s();
var _op = _s();
var _open = _s();
var _get = _s();
var _done = _s();
var _withReturn = _s();

var _p='prototype'
var _f='function'
var _n='number'
var _s='string'
var _b='boolean'
var _i='iterable'
var _o=[_f,'object']
var _gk=[_f, 'string']
var _gko=_gk.concat('undefined', 'null')

var arrProto = Array[_p];
var slice =  Function.call.bind(arrProto.slice);

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

    var iterable = anyToGenerator(source);

    // it's allowed to construct with nothing,  but you can't construct with a non-iterable entity.
    if (!iterable && !(source == null)) {
        throw new Error('iter can only be constructed with an iterable, iterator or generator. Use "fromObject" of your intent is to enumerate object properties.');
    }

    this[_iterator] = iterable || [][_iterator];
    this[_open] = []
}

Object.assign(Iter, {
    /**
     * Create an Iter from an object, returning a seqeunce of [key, value] 
     * pairs obtained by enumerating the object's properties. All properties, 
     * including those on the prototype chain, will be included, except 
     * constructor"
     *
     * @param {any} obj An object
     * @param {TestProvider<string>} [filter] A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
     * @returns {Iter} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
     */
    fromObject: checkArgs(newIter(makeObjectIterator, [true,false]), [_o,_f],1),
    /**
     * Create an Iter from an object, returning a seqeunce of [key, value] pairs obtained
     * by enumerating the object's properties. Only the object's own properties (e.g. no prototype chain)
     * are included.
     *
     * @param {any} obj An object
     * @param {TestProvider<string>} [filter] A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
     * @returns {Iter} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
     */
    fromObjectOwn: checkArgs(newIter(makeObjectIterator, [false,false]),[_o,_f],1),
    /**
     * Get metadata about the properties, and optionally the prototype chain, of an object
     *  
     * @param {object} object The object to refelect
     * @param {boolean} recurse If true, recurse prototype chain
     * @param {function} filter A callback invoked for each property name that should return true to include it, or false to exclude it
     * @returns {Iter} A sequence of [key, value] pairs where the key is the prop name, and the value is the prop descriptor
     */
    reflect: checkArgs(function(obj, recurse, filter) {
        if (typeOf(recurse) === _f) {
            filter=recurse;
            recurse=false;
        }
        var props = getAllProps(obj, recurse);
        if (filter) {
            props = props.filter(function(e, i) { return filter(e[0], i) });
        }

        return props.map(function(d) {
            var e = Object.getOwnPropertyDescriptor(d[1], d[0])
            var hasValue = e.hasOwnProperty('value') 
            return [d[0], {
                type: !hasValue ? null : 
                    typeOf(e.value), 
                field: hasValue,
                writable: !!e.writable || !!e.set, 
                get: e.get,
                set: e.set,
                configurable: e.configurable,
                enumerable: e.enumerable,
                depth: d[2]
            }];
        })
    },[_o,_b,_f],1),
    /**
     * Produce an iter instance using a callback to generate values, or repeating a single value.
     * 
     * @param {(index: number)=>any | any} object A function or object
     * @param {number} The number
     * @returns {Iter} an iter object
     */
    generate: function(obj, times) {
        var gen = typeOf(obj) === _f ? obj : function() { return obj }
        return new Iter(_iterator, function() {
            var index = -1;
            times = times || 1;
            return {
                next: function() {
                    return ++index >= times ? doneIter() : { 
                        done: false,
                        value: gen(index) 
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
    forEach: checkArgs(makeAggregator('var i=0','a.call(b,{v},i++)',';'),[_f],1),
    /**
     * Execute a callback for each element in the seqeunce, and return the same
     * element. 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} a seqeunce identical to the input sequence 
     */
    do: checkArgs(makeIterable(function(get, done, cb, thisArg) {
        var index = 0;
        var sourceIter = get()

        return function() {
            var cur = sourceIter.next();
            !cur.done && cb.call(thisArg, cur.value, index++)
            return cur.done ? done() : cur
        }
        
    }),[_f],1),
    /**
     * Group each element in the sequence according to the value of a property if `group` is a string,
     * or the value returned by `function(item, index)` if group is a function. Returns a sequence
     * of `[key, value]` pairs where `value` is an array containing each item in the group.
     *
     * @param {KeyProvider} key A property name or function that specifies a key to group by
     * @param {KeyProvider} map A property name or function that specifies how to map each value to the group 
     * @returns {Iter} A sequence of `[key, value[]]` pairs where `value` is an array of items in the group
     */
    groupBy: checkArgs(newIter(function(key, map) {
        var that = this;
        return function() {
            var cb = getValueMapper(key);
            var trans = getValueMapper(map)
            var dict = new Map();
            
            var cur;

            // using getIterator directly - we always iterate completely with groupBy
            
            var iterator = getIterator(that)
            while (cur = iterator.next(), !cur.done) {
                var k = cb(cur.value);
                (dict.get(k) || dict.set(k,[]).get(k))
                    .push(trans(cur.value))
            }

            return getIterator(dict);
        }
    }),[_gk, _f]),
    /**
     * Sort by the value of a property, if `order` is a string, or by the value returned by a
     * `function(item, index)` if `order` is a function
     *
     * @param {KeyProvider} order A property name or function identifying the sort key
     * @returns {Iter} The sorted sequence
     */    
    orderBy: checkArgs(function(order) {
        return orderBy(this, [{ 
            fn: order 
        }]);   
    },[_gk]),
    /**
     * Sort by the value of a property, in descending order. If `order` is a string, or 
     * by the value returned by a `function(item, index)` if `order` is a function
     *
     * @param {KeyProvider} order A property name or function identifying the sort key
     * @returns {Iter} The sorted sequence
     */    
    orderByDesc: checkArgs(function(order) {
        return orderBy(this, [{ 
            fn: order, desc: true
        }]);   
    },[_gk]),
    /**
     * Add a secondary or n-ary sort order if there are multiple items with 
     * the same value. Can only follow an `order` or `then` clause.
     *
     * @param {KeyProvider} order A property name or function identifying the sort key
     * @returns {Iter} The sorted sequence
     */    
    thenBy: checkArgs(thenBy,[_gk],1),
    /**
     * Add a secondary or n-ary descending sort order if there are multiple 
     * items with the same value. Can only follow an `order` or `then` clause.
     *
     * @param {KeyProvider} order A property name or function identifying the sort key
     * @returns {Iter} The sorted sequence
     */    
    thenByDesc: function(order) {
        return thenBy.call(this, order, true)
    },
    /**
     * Iterate over the entire sequence and count the items
     *
     * @returns {number} The number of items in the sequence
     */    
    count: makeAggregator('var r=0', 'r++'),
    /**
     * Skip `n` items in the seqeunce, and return a new sequence of all 
     * successive items.
     *
     * @param {number} n The number of items to skip
     * @returns {Iter} A sequence of all items after the skipped ones
     */    
    skip: checkArgs(function(n) {
        return this.skipWhile(function() {
            return n-- !== 0;
        })
    },[_n]),
    /**
     * Skip while the function evaluates to 'true' for the current value 
     *
     * @param {(any)=>boolean} callback The test function
     * @returns {Iter} A sequence of all items after the skipped ones
     */    
    skipWhile: checkArgs(makeIterable(function(get, done, cb) {
        var iterator = get()
        var cur
        return function() {
            if (cur) return iterator.next();
            
            while (cur=iterator.next(), !cur.done && cb(cur.value));
            return cur.done ? done() : cur;
        }
    }), [_f]),
    /**
     * Create a seqeunce of the next `n` items
     *
     * @param {number} n the number of items to take
     * @returns {Iter} a sequence of the taken items
     */    
    take: checkArgs(makeIterable(function(get, done, n) {
        var iterator = get()
        var last={};
        return function() {
            // !(n-- <= 0) ensures that when NaN is passed, it will iterate completely.
            // Otherwise, since NaN can never be decremented, it will never take anything off the iterator.

            if (!last.done && !(n-- <= 0)) last = iterator.next();

            return last.done || n < 0 ? done(n < 0) :
                last;
        }
    }), [_n], 1),
    /**
     * Create a sequence of of items that pass a test
     *
     * @param {(any)=>boolean} callback The test function
     * @returns {Iter} a sequence of the taken items
     */    
    takeWhile: checkArgs(makeIterable(function(get, done, cb) {
        var iterator = get()
        var last={}
        return function() {
            last = !last.done && iterator.next();
            if (!last.done && cb(last.value)) return last;
            return done(!last.done)
        }
    }), [_f]),
    /**
     * Convert all items in the sequence to instances of `Type` by invoking
     *      `Type` as a constructor with the sequence as an argument
     *
     * @param {new (element: any)=>any} Type the Constructor to use
     * @returns {Iter<T>} The new sequence
     */    
    cast: checkArgs(function(Type) {
        return this.map(function(e) { return new Type(e) })
    }, [_f],1),
    /**
     * Return the first item in the sequence, or `undefined`, or an optional
     * `defaultValue`
     *
     * @param {*} [defaultValue] a default value to return if the sequence has 
     *      no items.
     * @returns {*} The first item in the sequence, or `undefined` (or 
     *      `defaultValue`) if the sequence has no items.
     */
    first: makeAggregator('var r=a','z([_i]); return {v}','return r'),
    /**
     * Return the firlastst item in the sequence, or `undefined`, or an 
     * optional `defaultValue`
     *
     * @param {*} [defaultValue] a default value to return if the seqeunce has
     *      no items.
     * @returns {*} The first item in the sequence, or `undefined` (or 
     *      `defaultValue`) if the sequence has no items.
     */
    last: makeAggregator('var r=a,l','r={v}'),
    /**
     * Return a new sequence created by expanding any iterable elements in the
     * original sequence into their component elements.
     *
     * @param {boolean} [recurse] when true, recurse into inner iterable
     *      elements and add their component elements to the seqeunce too
     * @returns {Iter} a new sequence of all elements within inner sequences
     */
    flatten: checkArgs(makeIterable(function(get, done, recurse) {
        var iterators = [];
        var iterator = get();
        var open = this[_open]
        return function() {
            while (iterator || iterators.length > 0) {
                if (!iterator) {
                    iterator = iterators.pop();
                    if (open.indexOf(iterator)>0) open.push(iterator)
                }

                var cur = iterator.next();
                
                if (cur.value && isIterable(cur.value) && (recurse || iterators.length === 0)) {
                    iterators.push(iterator);
                    iterator = cur.value[_iterator]();
                    open.push(iterator)
                } else {
                    if (!cur.done) {
                        return cur
                    } else {
                        iterator = undefined;
                        open.pop();
                    }
                }
            }
            return done();
        }
    }), [_b]),
    /**
     * Return only unique elements in the seqeunce, using an optional key selector to 
     * identify uniqueness.
     * 
     * @param {function} cb The callback(element, index)
     * @param {key} key The id selector function or property (optional)
     * @returns {Iter} the new seqeunce 
     */
    unique: checkArgs(makeIterable(function(get, done, key) {
        var used = new Set();
        var iterator = get()
        var mapValue = getValueMapper(key);
        var cur;

        return function() {
            while (cur = iterator.next(), !cur.done) {
                var value = mapValue(cur.value)
                if (!used.has(value)) {
                    used.add(value)
                    return cur
                }
            }
            return done()
        }
    }),[_gk]),
    /**
     * Return all elements in the sequence that are not in the other sequence
     * 
     * @param {function} cb The callback(element, index)
     * @param {key} key The id selector function or property (optional)
     * @returns {Iter} the new seqeunce 
     */
    except: checkArgs(makeIterable(function(get, done, other, mapLeft, mapRight) {
        var leftMapper = getValueMapper(mapLeft)

        // we don't have to track open state for the other seq. because it's being handled by Set
        var except = new Set(orMapSequence(mapRight, other))

        var sourceIter = get()
        var cur

        return function() {
            while (cur = sourceIter.next(), 
                !cur.done && except.has(leftMapper(cur.value)))
                    ;
         
            return cur.done ? done() : cur;
        }
    },true),[_i, _gk, _gk],1),
     /**
     * Return a sequence that includes only members found in the original and
     * the other `sequence`. Can be followed by an `on` clause to specify key.
     *
     * @param {Iterable<any>} sequence the sequence of values to intersect
     * @returns {Iter} the new sequence
     */
    intersect: checkArgs(makeIterable(function(get, done, other, mapLeft, mapRight) {
        var leftMapper = getValueMapper(mapLeft)
        var intersect = new Set(orMapSequence(mapRight, other));
        var source = get()
        var cur
        return function() {
            while (cur = source.next(), 
                !cur.done && !intersect.has(leftMapper(cur.value)));

            return cur.done ? done() : cur;
        }
    }, true), [_i,_gk,_gk],1,1),
     /**
     * Return a new sequence containing all values found in either sequence.
     * Can be followed by an `on` clause to specify key.
     *
     * @param {Iterable<any>} sequence the sequence of values to union
     * @returns {Iter} the new sequence
     */
    union: checkArgs(newMultipartIter(function(other, mapLeft, mapRight) {
        var extra = new Iter(other).except(this);
        if (mapLeft || mapRight) extra = extra.on(mapLeft, mapRight)
        return this.concat(extra)[_iterator]
    }, 1),[_i],1,1),
    
     /**
     * Given a sequence of [key, value] pairs, join another sequence of
     * [key, value] pairs on `key`, and invoke `mergeCallback` for each
     * matched pair. Create a new sequence that contains an element for
     * each key in the original sequence, and a value from the `mergeCallback`.
     * this operation assumes the keys are unique, and there will be only one
     * element for each key in the resulting sequence. Any keys found only in
     *  the right sequence will be ommitted (left join).
     *
     * You can add a `on` clause to specify the keys and values on which to
     * merge, if your input is not in the form of `[key, value]` pairs. When
     * `on` is used, there can be multiple rows for each key, if there are
     * duplicates in the left or right sequences.
     *
     * @param {Iterable<any>} sequence the "right" sequence to join
     * @param {(left: any, right: any, key: any)=> any} mergeCallback the
     *     callback to create the merged value for each match
     * @returns a sequence of [key, value] pairs
     */
    leftJoin: checkArgs(makeIterable(function(get, done, sequence, mergeFn, mapLeft, mapRight) {
        var that = this;
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

        var iterator = get(this);
        var other = new Map(mapRight ? new Iter(sequence).groupBy(rightKeyMapper) : sequence)
        var matches;
        var leftValue;
        var id;

        return function() {
                /*eslint no-constant-condition:0 */
            while (true) {
                if (!matches) {
                    var left = iterator.next()

                    if (left.done) return done()

                    id = leftKeyMapper(left.value)
                    leftValue = leftValueMapper(left.value);
                    var match = other.get(id)
                    if (!match || !isIterable(match)) {
                        that[_open] = [iterator]
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
                    that[_open] = [iterator, matches]
                    return { 
                        done: false, 
                        value: mergeFn(leftValue, rightValueMapper(right.value), id)
                    }
                } else {
                    matches = null;
                }
            }
        }
    }, true),[_i],1),
    /**
     * Specify the keys for use in the preceding join or set operation
     * involving two sequences. The first argument should return a key for
     * items in the original sequence, and the second should return a key
     * for items in the other sequence.
     *
     * If only `mapLeft` is specified, it will be applied to both sequences.
     * If you want to apply it only to the original sequence, you can passed
     * `null` or `undefined` as the 2nd argument (or simply use `map` against
     * the original sequence first).
     *
     * @param {KeyProvider} left a function that returns a key from
     *    the original or "left" sequence
     * @param {KeyProvider} right a function that returns a key from the
     *    other or "right" sequence
     * @returns a sequence of [key, value] pairs
     */    
    on: checkArgs(function(mapLeft, _mapRight) {
        var mapRight = (arguments.length === 1) ? mapLeft : _mapRight;
        if (!this[_root]) throw new Error('"on" make no sense without a prior join or set merge operation.')
        return new Iter(_iterator, this[_op].apply(this[_root], this[_args].concat([mapLeft, mapRight])))
    }, [_gko, _gko],1),
    /**
     * Test whether two seqeunces are equal, meaning they are the same lengths and 
     * each item at the same position in each sequence is equal.
     *
     * @param {Iterable<any>} sequence the other sequence to test
     * @param {(item: any)=>any} keyLeft a function that returns a key from the original or "left" sequence
     * @param {(item: any)=>any} keyRight a function that returns a key from the other or "right" sequence
     * @returns {boolean} `true` if equal, `false` if not
     */
    sequenceEqual: checkArgs(function(sequence, keyLeft, keyRight) {
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
    }, [_i, _gko, _gko],1),
    /**
     * Assuming the seqeunce contains [key, value] pairs, return a sequence of the keys
     * 
     * @returns {Iter} the keys
     */    
    keys: function() {
        return this.map(checkFirstMapper(0, ensureKvp));
    },
    /**
     * Assuming the seqeunce contains [key, value] pairs, return a sequence of the values
     * 
     * @returns {Iter} the values
     */
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
        return new Iter([this].concat(slice(arguments))).flatten()
    },
    /**
     * Return a single element that is the return value of a function invoked for 
     * each element in the input sequence 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A transformed sequence 
     */    
    map: checkArgs(makeIterable(function(get, done, key, thisArg) {
        var mapFn = getValueMapper(key)
        var index = 0;
        var sourceIter = get();

        return function() {
            var cur = sourceIter.next();
            
            return cur.done ? done() : {
                done: false,
                value: mapFn.call(thisArg, cur.value, index++)
            }
        }
    }),[_gk],1),
    /**
     * Filter elements according to the callback's return value (false to exclude) 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A filtered sequence 
     */    
    filter: checkArgs(makeIterable(function(get, done, cb, thisArg) {

        var index = 0;
        var sourceIter = get()
        
        return function() {
            var cur = sourceIter.next();
            while (!cur.done && !cb.call(thisArg, cur.value, index++)) {
                cur = sourceIter.next();
            }

            return cur.done ? done() : cur;
        }
    }),[_f],1),
     /**
     * test whether some elements in the sequence match the condition
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @returns {boolean} true if any elements match the condition
     */
    some: checkArgs(makeAggregator('var i=0','if (a({v},b,i++)) { z([_i]); return true }','return false'),[_f],1),
     /**
     * test whether every element in the sequence matches the condition
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @returns {boolean} true if all elements match the condition
     */
    every: checkArgs(makeAggregator('var i=0','if (!a({v},b,i++)) {  z([_i]); return false }','return true'),[_f],1),
    /**
     * test whether the element appears in the sequence
     * 
     * @param {any} element the element to locate
     * @returns {boolean} true if the value is found
     */
    includes: makeAggregator('var i=0', 'if ({v}===a) { z([_i]); return true } i++', 'return false'),
    /**
     * return the index of the element
     * 
     * @param {any} element The element to locate
     * @returns {number} The index or -1
     */
    indexOf: makeAggregator('var i=0', 'if ({v}===a) { z([_i]); return i } i++', 'return -1'),
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
    findIndex: checkArgs(makeAggregator('var i=0','if (a.call(b,{v},i)===true) { z([_i]); return i } i++','return -1'), [_f],1),
    /**
     * return the element identified by a callback
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @returns {number} The index or `undefined` 
     */
    find: makeAggregator('var i=0','if (a.call(b,{v},i++)===true) { z([_i]); return {v} }','return undefined'),
    /**
     * Return the element at the specified 0-based position in the sequence, or `undefined`
     * if the sequence has fewer than
     *
     * @param {number} index the position of the item to return
     * @param {*} [defaultValue] a value to return if the index was out of range
     * @returns {*} the item at the specified position, or `undefined`, or `defaultValue`
     */
    get: checkArgs(function(n) {
        return this.skip(n).first()
    },[_n],1),
    /**
     * Return a subset of the sequence starting at 0-based position `begin` and ending at position `end`
     *
     * @param {number} begin the starting position
     * @param {number} end the ending position
     * @returns {Iter} the subsetted sequence
     */
    slice: checkArgs(function(begin, end) {
        // when end is missing, take gets NaN as an arg, and takes everything
        return this.skip(begin).take(end-begin);
    },[_n,_n],1),
    /**
     * a function invoked for each element, in reverse order, that must return the memoized payload that is passed to the next invocation
     *
     * @param {(last: any, current: any, index: number)=>any} callback
     * @param {*} initial the initial payload
     * @returns {*} the final payload
     */
    reduce: checkArgs(makeAggregator('var r=b,i=0', 'r=a(r,{v},i++)'), [_f],1),
    /**
     * a function invoked for each element, in reverse order, that must return the memoized payload that is passed to the next invocation
     *
     * @param {(last: any, current: any, index: number)=>any} callback
     * @param {*} initial the initial payload
     * @returns {*} the final payload
     */
    reduceRight: checkArgs(function(callback, initial) {
        // with reduceRight, we have to iterate the thing completely and capture the sequence,
        // so there's really no point in re-implementing the native array version
        return this.toArray().reduceRight(callback, initial)
    },[_f],1),
    /**
     * Return a string formed by joining each element in the sequence with a separator
     *
     * @param {string} separator the separator, defaults to ','
     * @returns a string of the joined sequence
     */    
    join: function(separator) {
        return this.toArray().join(separator);
    },
    /**
     * Sort the sequence using default comparison operator. If a `callback` is provided, then
     * it will use the return value to determine priority when comparing two elements `a` and `b`:
     * -1 means a<b, 1 means b<a
     *
     * @param {(a: any, b: any)=>number} callback the comparison callback
     * @returns {Iter} the sorted sequence
     */    
    sort: checkArgs(deferredAction(function(callback) {
        return this.toArray().sort(callback)
    }),[_f]),
    /**
     * Reverse the order of elements in the sequence
     *
     * @returns the reversed sequence
     */
    reverse: deferredAction(function() {
        return this.toArray().reverse()
    }),
    /**
     * Given a seqeunce of [key, value] pairs, create an object with {property: value} for each pair.
     *
     * @returns {*} the object
     */
    toObject: makeAggregator('var r={}','r[{v}[0]]={v}[1]'),
    /**
     * Craeate an array with each element in the seqeunce.
     *
     * @returns {any[]} the array
     */
    toArray: makeAggregator('var r=[]','r.push({v})'),
    /**
     * Create an instance of `Type` from the sequence.
     *
     * @param {new (element: any)=>any} Type The constructor for Type
     * @returns {*} An instance of `Type`
     */
    as: checkArgs(function(Cotr) {
        switch(Cotr) {
            case Array: return this.toArray();
            case Object: return this.toObject();
            default: return new Cotr(this);
        }
    },[_f],1),
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
    min: checkArgs(makeGetkeyAggregator('var r=Infinity', 'if (r>{v}) r={v}'), [_gk]),
    /**
     * Return the maximum value in the sequence
     * 
     * @param {function} getkey An optional callback invoked on each element that returns the value to sum
     * @returns {any} The maximum value 
     */
    max: checkArgs(makeGetkeyAggregator('var r=-Infinity', 'if (r<{v}) r={v}'),[_gk]),
    /**
     * Return the sum of all elements in the sequence
     * 
     * @param {any} getkey An optional callback invoked on each element that returns the value to sum
     * @returns {any} The sum of all elements in the sequence (using the + operator)
     */
    sum: checkArgs(makeGetkeyAggregator('var r=0', 'r+={v}'),[_gk]),
    /**
     * Return the mean (average) of all elements in the sequence
     *
     * @param {KeyProvider} key An optional callback invoked on each element that returns the value to sum
     * @returns {number} The sum of all elements in the sequence (using the + operator)
     */
    mean: checkArgs(makeGetkeyAggregator('var r=0,i=0', 'r+={v};i++', 'return r/i'), [_gk]),
    toString: function() {
        return '[' + this.take(20).join(',') + (this.count() > 20 ? ', ...' : '') + ']'
    }
};

/**
 * Get an iterator from an iterable, with guards
 * 
 * @param {any} obj
 * @returns {Iterator} an iterator
 */
Iter[_p][_get] = getIterator;


function getIterator(obj) {
    obj = obj || this;
    if (typeOf(obj[_iterator]) !== _f) {
        throw new Error('The entity was not a valid iterable. It must implement [Symbol.iterator]')
    }

    var iterator = obj[_iterator]();
    if (this) this[_open].push(iterator);
    
    if (typeOf(iterator.next) !== _f) {
        throw new Error('The iterable did not return a valid iterator.')
    }
    return iterator;
}

/**
 * Return a "done" iterator value, and reset open iterators
 */
Iter[_p][_done] = doneIter;

function doneIter(close) {
    if (this) {
        if (close) closeIter(this[_open])
        else this[_open] = [];
    }
    return {
        done: true
    }
}

/**
 * Generate an iterable response using with a return method that will close all the open iterables.
 */
Iter[_p][_withReturn] = function(next) {
    var that = this;
    return {
        next: next, 
        return: function() {
            that[_done](true)
        }
    }
}

function closeIter(iterators) {
    while (iterators.length) {
        var e = iterators.pop();
        if (e && typeOf(e.return) === _f) {
            e.return()
        }
    }
}

/*
Given some inline action to produce a sequence, wrap it as a generator
 */
function deferredAction(fn) {
    return function() {
        var that = this;
        var args = slice(arguments)
        return new Iter(_iterator, function() {
            return fn.apply(that, args)[_iterator]()
        })
    }
}


/**
 * Create a left-join iterator. Fully iterates the sequence on the right.
 * 
 * @param {iterable} The right side seqeunce
 * @param {any} onMap [fn, fn] array of functions to generate keys for the join
 * @returns {iterable} A new sequence
 */

function makeIterable(fn, multipart) {
    return (multipart ? newMultipartIter : newIter)(function() {
        var that = this;
        var args = slice(arguments);
        return function() {
            return that[_withReturn](fn.apply(that, [that[_get].bind(that), that[_done].bind(that)].concat(args)))
        }
    })
}


/**
 * Create a function that returns an Iter based on the generator.
 * `nargs` specifies the number of args from the original function
 * call to pass on to the generator function. This may be important
 * if the generator accepts more arguments internally than you want 
 * to expose to the public method.
 */
function newIter(generator, defaultArgs) {
    return function() {
        return new Iter(_iterator, 
            generator.apply(
                this, 
                (defaultArgs || []).concat(
                    slice(arguments)
                )
            )
        );
    }
}

/**
 * Like newIter above, but stores the iterator's construction data so
 * addtional methods can be chained to build the query (e.g. thenBy, on) 
 */
function newMultipartIter(generator) {
    return function() {
        return new Iter(_iterator, generator, this, slice(arguments));
    }
}

/**
 * Create a value mapper that type checks the first element of a sequence only for
 * validity, then replaces itself with the unchecked mapper. This is used to 
 * check for data type (e.g. key-value pairs) of a sequence without the performance
 * loss of checking every element.
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

    var loop = (getkey ? 
            'if (a) ' + iterMethod + ' {' + aggregator.replace(/\{v\}/g, 'a(' + valueAccessor +')') +  ';} else ' :
            '') +
        iterMethod + '{' + 
        aggregator.replace(/\{v\}/g, valueAccessor) +  
        ';};';

    /*
    a = a value transform function
    b, c = any other args
    g = getIterator
    z = closeIter
    */

    var fn = new Function('a', 'b', 'c', 'g', 'z', 
        'var _i=g(this),_c;' + setup + ';' +
        loop +  
        (teardown || 'return r'));
    
    // passing getIterator in without context causes it to not cache anything as open.
    // aggregators are always iterated completely

    return function(a, b, c) {
        return fn.call(this, a, b, c, getIterator, closeIter)
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
/**
 * Validate argument types
 * 
 * @param {Function} fn The fn
 * @param {Array} types The types list to check
 * @param {number} n Minimum required arguments
 * @returns {function} A higher order function
 */
function checkArgs(fn, types, n, maxArgs) {
    return function() {
        var args = slice(arguments, 0, maxArgs)
        if (n && args.length < n) throw new TypeError(n +' arguments are required.')
        for (var i=0;i<Math.min(args.length, types.length);i++) {
            var type = Array.isArray(types[i]) ? types[i] : [types[i]]
            
            if (isIterable(args[i]) && type.indexOf(_i)>=0) continue;
            var arg = typeOf(args[i])
            if (type.indexOf(arg) < 0) {
                throw new TypeError("Argument " + i + " must be of type: ["+type.join(',')+"], was "+arg)
            }
        }
        return fn.apply(this, args)
    }
}


/**
 * Return true if the entity i an iterable or an iterator
 * 
 * @param {any} obj
 * @returns
 */
function isIterable(obj) {
    return (obj && obj[_iterator] && typeOf(obj) !== _s)  ||
        (obj && obj.next && typeOf(obj.next) === _f);
}

function orderBy(root, orders) {
    var seq =  new Iter(_iterator, makeOrderByIterator(root, orders));
    seq[_orders] = orders;
    seq[_root] = root
    return seq;
}

function thenBy(order, desc) {
    if (!this[_orders]) throw new Error("thenBy only makes sense after orderBy")
    var orders = this[_orders].slice();
    orders.push({ 
        fn: order, 
        desc: desc 
    })
    return orderBy(this[_root], orders)
}

function makeOrderByIterator(that, orders) {
    orders.forEach(function(e) { e.fn = getValueMapper(e.fn)})
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

function makeObjectIterator(recurse, getters, obj, filter) {
    return function() {
        var data = Iter.reflect(
            obj,
            recurse,
            function(e) { return e !== 'constructor' && (!filter || filter(e)) }
        )

        if (!getters) data = data.filter(function(e) {return e[1].field });

        data = data.map(function(e) { return [e[0], obj[e[0]]] })
        return data[_iterator]()
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
    } else if (typeOf(mapfn) === _f) {
        return mapfn
    } else {
        return function(value) {
            return value[mapfn];
        } 
    }
    
}

/**
 * Helper for reflect
 * 
 * @param {any} obj
 * @param {any} recurse
 * @param {number} [depth=0]
 * @returns {Iter} an iterable of the props
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


/**
 * Given a generator, 
 * 
 * @param {any} obj
 * @returns
 */
function anyToGenerator(obj) {
    return obj && (
        typeOf(obj.next) === _f ? 
            iteratorToGenerator(obj) : 
            typeof(obj) === _f ? 
                obj : 
                obj[_iterator] ? 
                    obj[_iterator].bind(obj) :
                        undefined
    );
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
            }
        }
    }
}


function ensureKvp(obj) { 
    if (!obj || (!obj.hasOwnProperty(0) && obj.hasOwnProperty(1) && obj.length === 2)) {
        throw new Error('The object was not a key-value pair, e.g. a 2-element array')
    }
}

function typeOf(obj) {
    return obj === null ? 'null' : typeof obj;
}


module.exports = Iter;

