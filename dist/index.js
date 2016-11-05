'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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
var _p = 'prototype';
var arrProto = Array[_p];
var doneIter = {
    done: true
};
Object.freeze(doneIter);

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
            this[_iterator] = generator.apply(root, args);
            this[_op] = generator;
            this[_root] = root;
            this[_args] = args;
        }
        return;
    } else if (!(this instanceof Iter)) {
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
    this[_iterator] = iterator ? iterator.bind(source) : emptyGenerator;
}

Object.assign(Iter, {
    /**
     * Produce an Iter instance from a generator
     */
    fromGenerator: function fromGenerator(generator) {
        return new Iter(_iterator, generator);
    },
    /**
     * Produce an iter instance from an object
     */
    fromObject: function fromObject(obj, filter) {
        return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, true));
    },
    /**
     * Produce an iter instance from an object's own properties
     */
    fromObjectOwn: function fromObjectOwn(obj, filter) {
        return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, false));
    },
    reflect: function reflect(obj, recurse, filter) {
        if (typeof recurse === 'function') {
            filter = recurse;
            recurse = false;
        }
        return getPropDescriptions(obj, filter, recurse);
    },
    /**
     * Produce an iter instance using a callback to generate values, or repeating a single value
     */
    generate: function generate(obj, times) {
        return new Iter(_iterator, function () {
            var index = -1;
            return {
                next: function next() {
                    index++;
                    return iterResult(index >= times, typeof obj === 'function' ? obj(index) : obj);
                }
            };
        });
    }
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
    forEach: makeAggregator('var i=0', 'a.call(b,{v},i++)', ';'),
    /**
     * Execute a callback for each element in the seqeunce, and return the same
     * element. 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} a seqeunce identical to the input sequence 
     */
    do: function _do(cb, thisArg) {
        return new Iter(_iterator, makeDoIterator.call(this, cb, thisArg));
    },
    groupBy: function groupBy(group) {
        return new Iter(_iterator, makeGroupByIterator.call(this, group));
    },
    orderBy: function orderBy(order) {
        return _orderBy.call(this, order);
    },
    orderDesc: function orderDesc(order) {
        return _orderBy.call(this, order, true);
    },
    thenBy: function thenBy(order) {
        return _thenBy.call(this, order);
    },
    thenDesc: function thenDesc(order, desc) {
        return _thenBy.call(this, order, desc);
    },

    count: makeAggregator('var r=0', 'r++'),
    skip: function skip(n) {
        return new Iter(_iterator, skipIterable.call(this, n));
    },
    take: function take(n) {
        return new Iter(_iterator, takeIterable.call(this, n));
    },
    cast: function cast(Type) {
        return new Iter(_iterator, makeMapIterator.call(this, function (e) {
            return new Type(e);
        }));
    },
    first: function first(def) {
        var cur = this[_iterator]().next();
        return cur.done ? def : cur.value;
    },
    last: function last(def) {
        var iterator = this[_iterator]();
        var cur = iterator.next();
        if (cur.done) {
            return def;
        } else {
            var last = void 0;
            while (cur = iterator.next(), !cur.done) {
                last = cur.value;
            }
            return last;
        }
    },
    flatten: function flatten(recurse) {
        return new Iter(_iterator, makeFlattenIterator.call(this, recurse));
    },
    unique: function unique(getkey) {
        return new Iter(_iterator, makeUniqueIterator.call(this, getkey));
    },
    except: function except(sequence) {
        return new Iter(_iterator, makeExceptIterator, this, [sequence]);
    },
    intersect: function intersect(sequence) {
        return new Iter(_iterator, makeIntersectIterator, this, [sequence]);
    },
    union: function union(sequence) {
        return new Iter(_iterator, makeUnionIterator, this, [sequence]);
    },
    leftJoin: function leftJoin(sequence, callback) {
        return new Iter(_iterator, makeLeftJoinIterator, this, [sequence, callback]);
    },
    on: function on(mapLeft, mapRight) {
        if (arguments.length === 1) mapRight = mapLeft;
        if (!this[_root]) throw new Error('"on" doesn\'t make sense without a prior join or set merge operation.');
        return new Iter(_iterator, this[_op].apply(this[_root], this[_args].concat([mapLeft, mapRight])));
    },
    sequenceEqual: function sequenceEqual(sequence, mapLeft, mapRight) {
        var iter = this[_iterator]();
        var mapLeftFn = getValueMapper(mapLeft);
        var cur = void 0;
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator2 = orMapSequence(mapRight, sequence)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator2.next()).done); _iteratorNormalCompletion = true) {
                var otherItem = _step.value;

                cur = iter.next();
                if (cur.done || otherItem !== mapLeftFn(cur.value)) return false;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        if (!iter.next().done) return false;
        return true;
    },
    concat: function concat() {
        return new Iter(_iterator, makeConcatIterator.call(this, arguments));
    },

    /**
     * Return a single element that is the return value of a function invoked for 
     * each element in the input sequence 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A transformed sequence 
     */
    map: function map(cb, thisArg) {
        return new Iter(_iterator, makeMapIterator.call(this, cb, thisArg));
    },
    filter: function filter(cb, thisArg) {
        return new Iter(_iterator, makeFilterIterator.call(this, cb, thisArg));
    },

    /**
    * test whether some elements in the sequence match the condition
    * 
    * @param {any} callback a function (e,i) that returns true if this is the element to match
    * @param {thisArg} object the "this" argument to apply to the callback
    * @returns {boolean} true if any elements match the condition
    */
    some: makeAggregator('var i=0', 'if (a({v},b,i)) return true', 'return false'),
    /**
    * test whether every element in the sequence matches the condition
    * 
    * @param {any} callback a function (e,i) that returns true if this is the element to match
    * @param {thisArg} object the "this" argument to apply to the callback
    * @returns {boolean} true if all elements match the condition
    */
    every: makeAggregator('var i=0', 'if (!a({v},b,i++)) return false', 'return true'),
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
    findIndex: makeAggregator('var i=0', 'if (a.call(b,{v},i)===true) return i; i++', 'return -1'),
    /**
     * return the element identified by a callback
     * 
     * @param {any} callback a function (e,i) that returns true if this is the element to match
     * @param {thisArg} object the "this" argument to apply to the callback
     * @param {default} object the value to return if the index isn't found (or `undefined` if omitted
     * @returns {number} The index or `undefined` 
     */
    find: makeAggregator('var i=0', 'if (a.call(b,{v},i++)===true) return {v};', 'return c'),
    get: makeAggregator('var i=0', 'if (i++===a) return {v}', 'return c'),

    slice: function slice(begin, end) {
        // when end is missing, take gets NaN as an arg, and takes everything
        return this.skip(begin).take(end - begin + 1);
    },

    reduce: makeAggregator('var r=b;var i=0', 'r=a(r,{v},i++)'),
    reduceRight: function () {
        var reduceRight = makeAggregator('var r=b;var i=c', 'r=a(r,{v},i--)');

        return function (callback, initial) {
            var reversed = this.toArray().reverse();
            return reduceRight.apply(reversed, [callback, initial, reversed.length - 1]);
        };
    }(),
    join: function join(separator) {
        return this.toArray().join(separator);
    },

    toObject: makeAggregator('var r={}', 'r[{v}[0]]={v}[1]'),
    toArray: makeAggregator('var r=[]', 'r.push({v})'),
    as: function as(Cotr) {
        if (Cotr === Array) {
            return this.toArray();
        }
        return new Cotr(_defineProperty({}, _iterator, this[_iterator]));
    },

    /**
     * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
     * as in Iter object for further processing.
     * 
     * @returns {Iter} a new Iter object
     */
    execute: function execute() {
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
['sort', 'reverse'].forEach(function (method) {
    Iter[_p][method] = function () {
        var that = this;
        var args = arguments;
        return new Iter(_iterator, function () {
            var arr = that.toArray();
            return arrProto[method].apply(arr, args)[_iterator]();
        });
    };
});

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
    return new Function('a', 'b', 'c', 'var _i=this[Symbol.iterator]();' + (setup || 'var r=-1') + ';' + 'var _c;' + (getkey ? 'if (a) while (_c = _i.next(), !_c.done) {' + aggregator.replace(/\{v\}/g, 'a(_c.value)') + ';} else ' : '') + 'while (_c=_i.next(), !_c.done) {' + aggregator.replace(/\{v\}/g, '_c.value') + ';};' + (teardown || 'return r'));
}

/**
 * Wrap it wtih automatic "getkey" argument handling
 * 
 * @param {any} setup
 * @param {any} aggregator
 * @returns
 */
function makeGetkeyAggregator(setup, aggregator, teardown) {
    var aggregatorFn = makeAggregator(setup, aggregator, teardown, true);
    return function (getkey) {
        var mapfn = getkey && getValueMapper(getkey);
        return aggregatorFn.apply(this, [mapfn].concat(arrProto.concat.call(arguments)));
    };
}

function _orderBy(order, desc) {
    var orders = [orProp(order)];
    return orderByHelper.call(this, this, orders, desc);
}

function _thenBy(order, desc) {
    if (!this[_orders]) throw new Error("thenBy only makes sense after orderBy");
    var orders = this[_orders].slice(0);
    orders.push(orProp(order));
    return orderByHelper.call(this, this[_root], orders, desc);
}

function orderByHelper(root, orders, desc) {
    var seq = new Iter(_iterator, makeOrderByIterator.call(this, orders, desc));
    seq[_orders] = orders;
    seq[_root] = root;
    return seq;
}

function makeOrderByIterator(orders, desc) {
    var that = this;

    return function () {

        var sorted = that.toArray().sort(function (a, b) {
            var val = 0;
            for (var i = 0; val === 0 && i < orders.length; i++) {
                var fn = orders[i];
                var va = fn(desc ? b : a);
                var vb = fn(desc ? a : b);
                if (va < vb) val = -1;else if (vb < va) val = 1;
            }
            return val;
        });

        return sorted[_iterator]();
    };
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
    return function () {
        var useKvps = !mapLeft && !mapRight;

        // create transform functions for the join. If neither mapper functions are provided,
        // the default behavior is to treat both sequences as KVP lists.
        // if not, then get a function using the default "map provider" behavior of either
        // using a provided function, or treating the value as a property name.

        var leftKeyMapper = getValueMapper(useKvps ? 0 : mapLeft);
        var leftValueMapper = getValueMapper(useKvps ? 1 : null);
        var rightKeyMapper = getValueMapper(useKvps ? 0 : mapRight);
        var rightValueMapper = getValueMapper(useKvps ? 1 : null);

        var iterator = that[_iterator]();
        var other = new Map(mapRight ? new Iter(sequence).groupBy(rightKeyMapper) : sequence);
        var matches = void 0;
        var leftValue = void 0;
        var id = void 0;

        return {
            next: function next() {
                /*eslint no-constant-condition:0 */
                while (true) {
                    if (!matches) {
                        var left = iterator.next();

                        if (left.done) return doneIter;
                        id = leftKeyMapper(left.value);
                        leftValue = leftValueMapper(left.value);
                        var match = other.get(id);
                        if (!match || !match[_iterator] || typeof match === 'string') {
                            return {
                                done: false,
                                value: mergeFn(leftValue, match, id)
                            };
                        }
                        matches = match[_iterator]();
                    }

                    // being here means the right is iterable

                    var right = matches.next();
                    if (!right.done) {
                        return {
                            done: false,
                            value: mergeFn(leftValue, rightValueMapper(right.value), id)
                        };
                    } else {
                        matches = null;
                    }
                }
            }
        };
    };
}

function skipIterable(n) {
    var that = this;
    return function () {
        var iterator = that[_iterator]();
        while (n-- > 0 && !iterator.next().done) {}
        return iterator;
    };
}

function takeIterable(n) {
    var that = this;
    return function () {
        var iterator = that[_iterator]();
        return {
            next: function next() {
                if (n !== 0) {
                    var cur = iterator.next();
                    if (!cur.done) {
                        n--;
                        return {
                            done: false,
                            value: cur.value
                        };
                    }
                }
                return doneIter;
            }
        };
    };
}

function getNext(condition) {
    var sourceIter = this[_iterator]();
    var index = 0;
    return {
        next: function next() {
            var cur = sourceIter.next();
            while (!cur.done && !condition(cur, index++)) {
                cur = sourceIter.next();
            }
            return iterResult(cur.done, cur.value);
        }
    };
}

function makeObjectIterator(obj, filter, recurse, getters) {
    return function () {
        var data = getPropDescriptions(obj, function (e) {
            return e !== 'constructor' && (!filter || filter(e));
        }, recurse);

        if (!getters) data = data.filter(function (e) {
            return e[1].field;
        });
        data = data.map(function (e) {
            return [e[0], obj[e[0]]];
        });
        return data[_iterator]();
    };
}

function makeDoIterator(cb, thisArg) {
    verifyCb(cb);
    var that = this;
    return function () {
        var index = 0;
        var sourceIter = that[_iterator]();

        return {
            next: function next() {
                var cur = sourceIter.next();
                return iterResult(cur.done, !cur.done && (cb.call(thisArg, cur.value, index++), cur.value));
            }
        };
    };
}

function makeExceptIterator(other, mapLeft, mapRight) {
    var that = this;
    return function () {
        var leftMapper = getValueMapper(mapLeft);
        var except = new Set(orMapSequence(mapRight, other));
        return getNext.call(that, function (cur) {
            return !except.has(leftMapper(cur.value));
        });
    };
}

function makeIntersectIterator(other, mapLeft, mapRight) {
    var that = this;
    return function () {
        var leftMapper = getValueMapper(mapLeft);
        var intersect = new Set(orMapSequence(mapRight, other));
        return getNext.call(that, function (cur) {
            return intersect.has(leftMapper(cur.value));
        });
    };
}

function makeUnionIterator(other, mapLeft, mapRight) {
    var that = this;
    return function () {
        var extra = new Iter(other).except(that);
        if (mapLeft || mapRight) extra = extra.on(mapLeft, mapRight);
        return that.concat(extra)[_iterator]();
    };
}

function makeUniqueIterator(getkey) {
    var that = this;
    return function () {
        var used = new Set();
        var iterator = that[_iterator]();
        var cur = void 0;
        var mapValue = getValueMapper(getkey);
        return {
            next: function next() {
                while (cur = iterator.next(), !cur.done) {
                    var value = mapValue(cur.value);
                    if (!used.has(value)) {
                        used.add(value);
                        return {
                            done: false,
                            value: cur.value
                        };
                    }
                }
                return doneIter;
            }
        };
    };
}

function makeGroupByIterator(group) {
    var that = this;
    return function () {
        var cb = getValueMapper(group);
        var dict = new Map();

        var cur = void 0;
        var iterator = that[_iterator]();
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
    };
}

function makeConcatIterator(args) {
    var that = this;
    return function () {
        var sources = [that];
        arrProto.forEach.call(args, function (arg) {
            sources.push(arg);
        });

        var index = 0;
        var iterator = void 0;

        return {
            next: function next() {
                while (index < sources.length) {

                    if (!iterator) {
                        var nextSource = sources[index];
                        iterator = typeof nextSource !== 'string' && nextSource[_iterator] ? nextSource[_iterator]() : objectAsGenerator(nextSource);
                    }

                    var cur = iterator.next();
                    if (!cur.done) {
                        return {
                            done: false,
                            value: cur.value
                        };
                    } else {
                        iterator = null;
                        index++;
                    }
                }
                return doneIter;
            }
        };
    };
}

function makeFlattenIterator(recurse) {
    var that = this;
    return function () {
        var iterators = [that[_iterator]()];
        var iterator = void 0;
        return {
            next: function next() {
                while (iterator || iterators.length > 0) {
                    if (!iterator) iterator = iterators.pop();
                    var cur = iterator.next();
                    if (cur.value && cur.value[_iterator] && typeof cur.value !== 'string' && (recurse || iterators.length === 0)) {
                        iterators.push(iterator);
                        iterator = cur.value[_iterator]();
                    } else {
                        if (!cur.done) {
                            return { done: false, value: cur.value };
                        } else {
                            iterator = undefined;
                        }
                    }
                }
                return doneIter;
            }
        };
    };
}

function makeFilterIterator(cb, thisArg) {
    verifyCb(cb);
    var that = this;
    return function () {
        var index = 0;
        var sourceIter = that[_iterator]();

        return {
            next: function next() {

                var cur = sourceIter.next();
                while (!cur.done && !cb.call(thisArg, cur.value, index++)) {
                    cur = sourceIter.next();
                }
                return iterResult(cur.done, cur.value);
            }
        };
    };
}

function makeMapIterator(cb, thisArg) {
    verifyCb(cb);
    var that = this;
    return function () {
        var index = 0;
        var sourceIter = that[_iterator]();

        return {
            next: function next() {
                var cur = sourceIter.next();
                return iterResult(cur.done, !cur.done && cb.call(thisArg, cur.value, index++));
            }
        };
    };
}

function orMapSequence(mapFn, iterable) {
    return !(mapFn == null) ? new Iter(iterable).map(getValueMapper(mapFn)) : iterable;
}

/**
 * Given a mapFn which can be missing, a function, or something else (probably
 * a string) that identifies a property, return a transformation function
 * 
 * @param {any} mapFn The map function or property
 * @returns A map function
 */
function getValueMapper(mapfn) {
    if (mapfn == null) {
        return function (value) {
            return value;
        };
    } else if (typeof mapfn === 'function') {
        return mapfn;
    } else {
        return function (value) {
            return value[mapfn];
        };
    }
}

function orProp(obj) {
    return typeof obj === 'function' ? obj : function (e) {
        return e[obj];
    };
}

function iterResult(done, value) {
    if (!done) {
        return {
            value: value,
            done: false
        };
    } else {
        return doneIter;
    }
}

/**
 * An empty iterable
 * 
 * @returns {function} An iterator
 */
function emptyGenerator() {
    return function () {
        return {
            next: function next() {
                return doneIter;
            }
        };
    };
}

function verifyCb(cb) {
    if (typeof cb !== 'function') throw new Error('The callback argument was not a function.');
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
        next: function next() {
            return done ? doneIter : (done = true, { done: false, value: e });
        }
    };
}

/**
 * Helper for getPropDescriptions
 * 
 * @param {any} obj
 * @param {any} recurse
 * @param {number} [depth=0]
 * @returns
 */
function getAllProps(obj, recurse) {
    var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    // only get prop/owner pairs first, to avoid reflecting on everything deep in the chain that may be overridden

    var props = new Iter(Object.getOwnPropertyNames(obj)).map(function (e) {
        return [e, obj, depth];
    }).execute();

    if (recurse) {
        var parentProto = Object.getPrototypeOf(obj);
        if (parentProto !== Object.prototype) {
            props = props.union(getAllProps(parentProto, true, depth + 1)).on('0');
        }
    }

    return props;
}

function getPropDescriptions(obj, filter, recurse) {

    var props = getAllProps(obj, recurse);
    if (filter) {
        verifyCb(filter);
        props = props.filter(function (e) {
            return filter(e[0]);
        });
    }
    return props.map(function (d) {
        var e = Object.getOwnPropertyDescriptor(d[1], d[0]);
        var hasValue = e.hasOwnProperty('value');
        return [d[0], {
            type: !hasValue ? null : e.value === null ? 'null' : _typeof(e.value),
            field: hasValue,
            writable: !!e.writable || !!e.set,
            getter: e.get || null,
            setter: e.set || null,
            configurable: e.configurable,
            enumerable: e.enumerable,
            depth: d[2]
        }];
    });
}

function Kvp(arr, value) {
    this._0 = value ? arr : arr[0];
    this._1 = value || arr[1];
}

['0', '1', 'key', 'value'].forEach(function (prop, i) {
    Object.defineProperty(Kvp[_p], prop, {
        get: new Function('return this._' + i % 2)
    });
});

Object.assign(Kvp[_p], {
    toString: function toString() {
        return '[' + this.key + ',' + this.value + ']';
    },
    valueOf: function valueOf() {
        return this.key;
    }
});

exports.default = Iter;
exports.Kvp = Kvp;