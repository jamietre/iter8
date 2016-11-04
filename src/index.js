/**
 * iter8 - an iteration utility library
 * Author: James Treworgy
 * License: MIT
 * 
 * The jsdoc in this file may not be maintained; please see `index.d.ts` for current method documentation.
 */
const _orders = Symbol();
const _root = Symbol();
const _args = Symbol();
const _op = Symbol();
const _iterator = Symbol.iterator;
const arrProto = Array.prototype;
const doneIter = {
    done: true
}
Object.freeze(doneIter)

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

    const iterator = source && source[_iterator];

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
     */
    fromGenerator:  function(generator) {
        return new Iter(_iterator, generator);
    },
    /**
     * Produce an iter instance from an object
     */
    fromObject: function(obj, filter) {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, false));
    },
    /**
     * Produce an iter instance from an object's own properties
     */
    fromObjectOwn: function(obj, filter) {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, true));
    },
    reflect: function(obj, proto) {
        return getPropDescriptions(obj, proto)
    },
    /**
     * Produce an iter instance using a callback to generate values, or repeating a single value
     */    
    generate(obj, times) {
        return new Iter(_iterator, function() {
            let index = -1;
            return {
                next() {
                    index++;
                    return iterResult(index >= times, (typeof obj === 'function' ? obj(index) : obj))
                }
            } 
        });
    },
});

Iter.prototype = {
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
    do(cb, thisArg) {
        return new Iter(_iterator, makeDoIterator.call(this, cb, thisArg));
    },
    groupBy(group) {
        return new Iter(_iterator, makeGroupByIterator.call(this, group))
    },
    orderBy(order) {
        return orderBy.call(this, order)
    },
    orderDesc(order) {
        return orderBy.call(this, order, true)
    },
    thenBy(order) {
        return thenBy.call(this, order)
    },
    thenDesc(order, desc) {
        return thenBy.call(this, order, desc)
    },
    count: makeAggregator('var r=0', 'r++'),
    skip(n) {
        return new Iter(_iterator, skipIterable.call(this, n));
    },
    take(n) {
        return new Iter(_iterator, takeIterable.call(this, n));
    },
    cast(Type) {
        return new Iter(_iterator, makeMapIterator.call(this, function(e) {
            return new Type(e);
        }));
    },
    first(def) {
        let cur = this[_iterator]().next()
        return cur.done ? def : cur.value;
    },
    last(def) {
        let iterator = this[_iterator]()
        let cur = iterator.next()
        if (cur.done) {
            return def;
        } else {
            let last;
            while (cur = iterator.next(), !cur.done) {
                last = cur.value;    
            }
            return last;
        }
    },
    flatten(recurse) {
        return new Iter(_iterator, makeFlattenIterator.call(this, recurse));
    },
    unique() {
        return new Iter(_iterator, makeUniqueIterator.call(this));
    },
    except(sequence) {
        return new Iter(_iterator, makeExceptIterator, this, [sequence]);
    },
    intersect(sequence) {
        return new Iter(_iterator, makeIntersectIterator, this, [sequence]);
    },
    union(sequence) {
        return new Iter(_iterator, makeUnionIterator, this, [sequence]);
    },
    leftJoin(sequence, callback) {
        return new Iter(_iterator, makeLeftJoinIterator, this, [sequence, callback]);
    },
    on(mapLeft, mapRight) {
        if (arguments.length === 1) mapRight = mapLeft;
        if (!this[_root]) throw new Error(`"on" doesn't make sense without a prior join or set merge operation.`)
        return new Iter(_iterator, this[_op].apply(this[_root], this[_args].concat([mapLeft, mapRight])))
    },
    sequenceEqual(sequence, mapLeft, mapRight) {
        const iter = this[_iterator]();
        const mapLeftFn = getValueMapper(mapLeft)
        let cur;
        for (var otherItem of orMapSequence(mapRight, sequence)) {
            cur = iter.next();
            if (cur.done ||  otherItem !== mapLeftFn(cur.value)) return false; 
        }

        if (!iter.next().done) return false;
        return true;
    },
    concat() {
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
    map(cb, thisArg) {
        return new Iter(_iterator, makeMapIterator.call(this, cb, thisArg));
    },
    filter(cb, thisArg) {
        return new Iter(_iterator, makeFilterIterator.call(this, cb, thisArg));
    },
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
    
    slice(begin, end) {
        // when end is missing, take gets NaN as an arg, and takes everything
        return this.skip(begin).take(end-begin+1);
    },
    reduce: makeAggregator('var r=b;var i=0', 'r=a(r,{v},i++)'),
    reduceRight: (function() {
        let reduceRight = makeAggregator('var r=b;var i=c', 'r=a(r,{v},i--)')

        return function(callback, initial) {
            let reversed = this.toArray().reverse();
            return reduceRight.apply(reversed, [callback, initial, reversed.length-1]);
        }  
    })(),
    join(separator) {
        return this.toArray().join(separator);
    },
    toObject: makeAggregator('var r={}','r[{v}[0]]={v}[1]'),
    toArray: makeAggregator('var r=[]','r.push({v})'),
    as(Cotr) {
        if (Cotr === Array) {
            return this.toArray();
        }
        return new Cotr({
            [_iterator]: this[_iterator]
        });
    },
    /**
     * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
     * as in Iter object for further processing.
     * 
     * @returns {Iter} a new Iter object
     */
    execute() {
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
['sort', 'reverse'].forEach((method)=> {
    Iter.prototype[method]=function() {
        var that = this;
        var args = arguments;
        return new Iter(_iterator, function() {
            let arr = that.toArray(); 
            return arrProto[method].apply(arr,args)[_iterator]();
        });
    }
})

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
    const aggregatorFn = makeAggregator(setup, aggregator, teardown, true)
    return function(getkey) {
        let mapfn = getkey && getValueMapper(getkey);
        return aggregatorFn.apply(this, [mapfn].concat(arrProto.concat.call(arguments)))
    }
}


function orderBy(order, desc) {
    let orders=[orProp(order)];
    return orderByHelper.call(this, this, orders, desc)
}

function thenBy(order, desc) {
    if (!this[_orders]) throw new Error("thenBy only makes sense after orderBy")
    let orders = this[_orders].slice(0);
    orders.push(orProp(order))
    return orderByHelper.call(this, this[_root], orders, desc)
}

function orderByHelper(root, orders, desc) {
    let seq =  new Iter(_iterator, makeOrderByIterator.call(this, orders, desc));
    seq[_orders] = orders;
    seq[_root] = root
    return seq;
}

function makeOrderByIterator(orders, desc){
    var that = this;

    return function() {
        
        let sorted = that.toArray().sort(function(a, b) {
            let val=0;
            for (let i=0; val===0 && i<orders.length; i++) {
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
        const useKvps = !mapLeft && !mapRight;

        // create transform functions for the join. If neither mapper functions are provided,
        // the default behavior is to treat both sequences as KVP lists.
        // if not, then get a function using the default "map provider" behavior of either
        // using a provided function, or treating the value as a property name.

        const leftKeyMapper = getValueMapper(useKvps ? 0 : mapLeft)
        const leftValueMapper = getValueMapper(useKvps ? 1 : null)
        const rightKeyMapper = getValueMapper(useKvps ? 0 : mapRight)
        const rightValueMapper = getValueMapper(useKvps ?  1 : null)
         
        let iterator = that[_iterator]();
        let other = new Map(mapRight ? new Iter(sequence).groupBy(rightKeyMapper) : sequence)
        let matches;
        let leftValue;
        let id;
        
        
        return {
            
            next() {
                /*eslint no-constant-condition:0 */
                while (true) {
                    if (!matches) {
                        let left = iterator.next()

                        if (left.done) return doneIter
                        id = leftKeyMapper(left.value)
                        leftValue = leftValueMapper(left.value);
                        let match = other.get(id)
                        if (!match || !match[_iterator] || typeof match === 'string') {
                            return { 
                                done: false, 
                                value: mergeFn(leftValue, match, id) 
                            }
                        }
                        matches = match[_iterator]() 
                    } 

                    // being here means the right is iterable
                    
                    let right = matches.next();
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
        let iterator = that[_iterator]()
        while (n-- > 0 && !iterator.next().done) ;
        return iterator;
    } 
}

function takeIterable(n) {
    var that = this;
    return function() {
        let iterator = that[_iterator]()
        return {
            next() {
                if (n !== 0) {
                    let cur = iterator.next();
                    if (!cur.done) {
                        n--;
                        return {
                            done: false,
                            value: cur.value
                        }
                    }
                }
                return doneIter
            }
        }
    } 
}

function getNext(condition) {
    let sourceIter = this[_iterator]()
    let index = 0;
    return {    
        next: function() {
            let cur = sourceIter.next();
            while (!cur.done && !condition(cur, index++)) {
                cur = sourceIter.next();
            }
            return iterResult(cur.done, cur.value);
        }
    }
}


function makeObjectIterator(obj, filter, ownPropsOnly/*, includeGetters*/) {
    if (filter) verifyCb(filter)
    return function() {
        let props;
        if (!ownPropsOnly) {
            props = [];
            for (var prop in obj) {
                props.push(prop);
            }
        } else {
            props = Object.keys(obj);
        }
        let sourceIter = props[_iterator]();

        return {
            next: ()=> {
                let cur = sourceIter.next();
                while (!cur.done && (cur.value === 'constructor' || 
                    (filter && !filter(cur.value)))) {
                    cur = sourceIter.next();
                } 
                return iterResult(cur.done, !cur.done && [cur.value, obj[cur.value]])
            }
        }
    }
}

function makeDoIterator(cb, thisArg) {
    verifyCb(cb)
    var that = this;
    return function() {
        let index = 0;
        let sourceIter = that[_iterator]()

        return {
            next: ()=> {
                let cur = sourceIter.next();
                return iterResult(cur.done, !cur.done && 
                    (cb.call(thisArg, cur.value, index++), cur.value))
            }
        }
    }
}

function makeExceptIterator(other, mapLeft, mapRight) {
    const that = this;
    return function() {
        const leftMapper = getValueMapper(mapLeft)
        const except = new Set(orMapSequence(mapRight, other))
        return getNext.call(that, (cur)=> !except.has(leftMapper(cur.value)))
    }
}

function makeIntersectIterator(other, mapLeft, mapRight) {
    const that = this;
    return function() {
        const leftMapper = getValueMapper(mapLeft)
        const intersect = new Set(orMapSequence(mapRight, other));
        return getNext.call(that, (cur)=> intersect.has(leftMapper(cur.value)))
    }
}

function makeUnionIterator(other, mapLeft, mapRight) {
    var that = this;
    return function() { 
        
        let extra = new Iter(other).except(that);
        if (mapLeft || mapRight) extra = extra.on(mapLeft, mapRight)

        return that.concat(extra)[_iterator]()
    }    
}

function makeUniqueIterator() {
    var that = this;
    return function() {
        let used = new Set();
        let iterator = that[_iterator]()
        let cur;
        return {
            next: function() {
                while (cur = iterator.next(), !cur.done) {
                    if (!used.has(cur.value)) {
                        used.add(cur.value)
                        return {
                            done: false,
                            value: cur.value
                        }
                    }
                }
                return doneIter
            }
        }
        
    }
}

function makeGroupByIterator(group) {
    var that = this;
    return function() {
        const cb = getValueMapper(group);
        let dict = new Map();
        
        let cur;
        let iterator = that[_iterator]()
        while (cur = iterator.next(), !cur.done) {
            let e = cur.value;
            let key = cb(e);
            if (dict.has(key)) {
                dict.get(key).push(e);
            } else {
                dict.set(key, [e]);
            }
        }

        return dict[_iterator]();
    }
}


function makeConcatIterator(args) {
    var that = this;
    return function() {
        const sources = [that];
        arrProto.forEach.call(args, function(arg) {
            sources.push(arg);
        })
        
        let index = 0;
        let iterator;

        return {
            next() {
                while (index < sources.length) {
                    
                    if (!iterator) {
                        const nextSource = sources[index]
                        iterator = typeof nextSource !== 'string' && nextSource[_iterator] ? 
                            nextSource[_iterator]() : 
                            objectAsGenerator(nextSource);
                    } 
                    
                    let cur = iterator.next();
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
                return doneIter;                
            }
        }        
    }
}

function makeFlattenIterator(recurse) {
    var that = this;
    return function() {
        let iterators = [that[_iterator]()];
        let iterator;
        return {
            next() {
                while (iterator || iterators.length > 0) {
                    if (!iterator) iterator = iterators.pop();
                    let cur = iterator.next();
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
                return doneIter;
            }
        }
    }
}

function makeFilterIterator(cb, thisArg) {
    verifyCb(cb)
    var that = this;
    return function() {
        let index = 0;
        let sourceIter = that[_iterator]()

        return {
            next: ()=> {
                
                let cur = sourceIter.next();
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
        let index = 0;
        let sourceIter = that[_iterator]();

        return {
            next: ()=> {
                let cur = sourceIter.next();
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
        return doneIter
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
            next() {
                return doneIter
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
    let done = false;
    return { 
        next() {
            return done ? doneIter : (done=true, { done: false, value: e })
        }
    }
}

function getAllProps(obj, recurse, depth=0) {
    // only get prop/owner pairs first, to avoid reflecting on everything deep in the chain that may be overridden

    let props = new Iter(Object.getOwnPropertyNames(obj)).map((e)=>[e, obj, depth]).execute() 
    
    if (recurse) {
        let parentProto = Object.getPrototypeOf(obj)
        if (parentProto !== Object.prototype) {
            props = props
                .union(getAllProps(parentProto, true, depth+1))
                .on('0')
        }
    }

    return props;
} 

function getPropDescriptions(obj, recurse) {
    return getAllProps(obj, recurse).map((d)=> {
        let e = Object.getOwnPropertyDescriptor(d[1], d[0])
        let hasValue = e.hasOwnProperty('value') 
        return [d[0], {
            type: !hasValue ? null : 
                e.value === null ? 'null' : 
                typeof e.value, 
            field: hasValue,
            writable: !!e.writable || !!e.set, 
            getter: !!e.get,
            setter: !!e.set,
            configurable: e.configurable,
            enumerable: e.enumerable,
            depth: d[2]
        }];
    })
}

export default Iter;

