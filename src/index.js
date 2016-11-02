
const _orders = Symbol();
const _root = Symbol();
const _join = Symbol();
const _iterator = Symbol.iterator;
const arrProto = Array.prototype;
const doneIter = {
    done: true
}
Object.freeze(doneIter)

function Iter(source, iter) {
    if (source === _iterator) {
        this[_iterator] = iter;
        return;
    }
    
    if (!(this instanceof Iter)) {
        return new Iter(source)
    }

    const iterator = source && source[_iterator];
    if (source && !iterator) {
        if (source && typeof source !== 'function') {
            return Iter.fromObjectOwn(source);
        }
        throw new Error('iter can only be sourced with an Iterable object or a regular Javascript object.');
    } 
    this[_iterator]=iterator ? iterator.bind(source) : emptyIterator;
}

Object.assign(Iter, {
    fromGenerator:  function(generator) {
        return new Iter(_iterator, generator);
    },
    fromObject: function(obj, filter) {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, false));
    },
    fromObjectOwn: function(obj, filter) {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, true));
    },
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
    forEach(cb, thisArg) {
        new Iter(_iterator, makeForEachIterator.call(this,cb, thisArg)).execute()
    },
    /**
     * Execute a callback for each element in the seqeunce, and return the same
     * element. 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} a seqeunce identical to the input sequence 
     */
    do(cb, thisArg) {
        return new Iter(_iterator, makeDoIterator.call(this,cb, thisArg));
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
    count() {
        let count=0;
        let iterator = this[_iterator]()
        while (!iterator.next().done) count++;
        return count;
    },
    skip(n) {
        return new Iter(_iterator, skipIterable.call(this, n));
    },
    // skipWhile: function(/*cb*/) {
    //     throw new Error('not implemented')
    // },
    take(n) {
        return new Iter(_iterator, takeIterable.call(this, n));
    },
    // takeWhile: function(/*cb*/) {
    //     throw new Error('not implemented')
    // },
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
    // todo: equality comparitor callback.
    unique() {
        return new Iter(_iterator, makeUniqueIterator.call(this));
    },
    except(sequence) {
        return new Iter(_iterator, makeExceptIterator.call(this, sequence));
    },
    intersect(sequence) {
        return new Iter(_iterator, makeIntersectIterator.call(this, sequence));
    },
    union(sequence) {
        let extra = new Iter(sequence).except(this);
        return this.concat(extra);
    },
    leftJoin(sequence, mergeCallback) {
        let iter =  new Iter(_iterator, makeLeftJoinIterator.call(this, sequence, mergeCallback));
        iter[_join] = arguments;
        iter[_root] = this;
        return iter;
    },
    joinOn(mapLeft, mapRight) {
        if (!this[_join]) throw new Error(`"on" doesn't make sense without a join`)
        return new Iter(_iterator, makeLeftJoinIterator.call(this[_root], this[_join][0], this[_join][1], mapLeft, mapRight));
    },
    sequenceEqual(sequence) {
        let iter = this[_iterator]();
        let cur;
        for (var other of sequence) {
            cur = iter.next();
            if (cur.done || other !== cur.value) return false; 
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

    some(cb, thisArg) {
        let iterator = this[_iterator]()
        let cur;
        let index=0;
        while (cur = iterator.next(), !cur.done) {
            if (cb.call(thisArg, cur.value, index++)) {
                return true;
            }
        }
        return false;
    },
    every(cb, thisArg) {
        let iterator = this[_iterator]()
        let cur;
        let index =0;
        while (cur = iterator.next(), !cur.done) {
            if (!cb.call(thisArg, cur.value, index++)) {
                return false;
            }
        }
        return true;
    },
    includes(el) {
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            if (cur.value===el) {
                return true;
            }
        }
        return false;
    },
    /*
     * When implemented, this method should return a single sequence with only unique values.
     * This can be done with concat().unique()
     */
    // union: function(/*sequence*/) {
    //     throw new Error('not implemented');
    // },
    indexOf(el) {
        let iterator = this[_iterator]()
        let cur;
        let index = 0;
        while (cur = iterator.next(), !cur.done) {
            if (cur.value===el) {
                return index;
            }
            index++;
        }
        return -1;
    },
    lastIndexOf(el) {
        let iterator = this[_iterator]()
        let cur;
        let index = 0;
        let lastIndex = -1;
        while (cur = iterator.next(), !cur.done) {
            if (cur.value===el) {
                lastIndex = index;
            }
            index++;
        }
        return lastIndex;
    },
    findIndex(cb, thisArg) {
        return findHelper.call(this, cb, thisArg)[0];
    },
    find(cb, thisArg, def) {
        return findHelper.call(this, cb, thisArg, def)[1];
    },
    get(index, def) {
        let iterator = this[_iterator]()
        let cur;
        let i = 0;
        while (cur = iterator.next(), !cur.done && i < index)  i++;
        
        return cur.done ? def : cur.value; 
    },
    slice(begin, end) {
        return this.skip(begin).take(end-begin+1);
    },
    reduce(callback, initial) {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduce(callback, initial);
    },
    reduceRight(callback, initial) {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduceRight(callback, initial);
    },
    join(separator) {
        return this.toArray().join(separator);
    },
    toObject() {
        let obj={};
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            obj[cur.value[0]]=cur.value[1]
        }
        return obj;
    },
    toArray() {
        let arr = [];
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            arr.push(cur.value);
        }
        return arr;
    },
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
    min(mapCallback) {
        return Math.min.apply(null, (mapCallback ? this.map(mapCallback) : this).toArray());
    },
    /**
     * Return the maximum value in the sequence
     * 
     * @param {function} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The maximum value 
     */
    max(mapCallback) {
        return Math.max.apply(null, (mapCallback ? this.map(mapCallback) : this).toArray());
    },
    /**
     * Return the sum of all elements in the sequence
     * 
     * @param {any} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The sum of all elements in the sequence (using the + operator)
     */
    sum(mapCallback) {
        let iterator = this[_iterator]()
        let cur;
        let total = 0;
        while (cur = iterator.next(), !cur.done) total+=mapCallback ? mapCallback(cur.value) : cur.value;
        return total;
    }
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
        let iterator = that[_iterator]();
        let other = new Map(mapRight ? new Iter(sequence).groupBy(e=>mapRight(e)) : sequence)
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
                        id = mapLeft ? mapLeft(left.value) : left.value[0]
                        leftValue = mapLeft ? left.value : left.value[1];
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
                            value: mergeFn(leftValue, mapRight ? right.value : right.value[1], id)
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

function makeForEachIterator(cb, thisArg) {
    var that = this;
    return function() {
        let index = 0;
        let sourceIter = that[_iterator]()
        let finished = false;
        return {
            next: ()=> {
                let cur = sourceIter.next();
                finished |= cur.done;
                return iterResult(finished, !finished && 
                    (finished = cb.call(thisArg, cur.value, index++)===false, cur.value))
            }
        }
    }
}

function makeExceptIterator(other) {
    var that = this;
    return function() {
        let except = new Set(other);        
        return getNext.call(that, (cur)=> !except.has(cur.value))
    }
}

function makeIntersectIterator(other) {
    var that = this;
    return function() {
        let intersect = new Set(other);
        return getNext.call(that, (cur)=> intersect.has(cur.value))
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
        const cb = orProp(group);
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
                            objectAsIterator(nextSource);
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

    // var that =this;
    // return function() {
    //     let sourceIter = that[_iterator]()
    //     let iter=sourceIter;

    //     return {
    //         next: ()=> {
    //             let value = null;
    //             while(!value) {
    //                 const isSource = iter === sourceIter;
    //                 let cur = iter.next();
    //                 if (cur.done) {
    //                     if (!isSource) {
    //                         iter = sourceIter;
    //                     } else {
    //                         return doneIter
    //                     }
    //                 } else {
    //                     if (isSource && cur.value[_iterator]) {
    //                         iter = cur.value[_iterator]();
    //                     } else {
    //                         value = cur.value;
    //                     }
    //                 }
    //             }

    //             return {
    //                 done: false,
    //                 value: value    
    //             }
    //         }
    //     }
    // }
}

function makeFilterIterator(cb, thisArg) {
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
function findHelper(cb, thisArg, def) {
    let iterator = this[_iterator]()
    let cur;
    let index = 0;
    while (cur = iterator.next(), !cur.done) {
        if (cb.call(thisArg, cur.value, index)) {
            return [index, cur.value];
        }
        index++;
    }
    return [-1, def];
}

function emptyIterator() {
    return function() {
        return {
            next() {
                return doneIter
            }
        }
    }
}

/**
 * Make a single element iterable
 * 
 * @param {any} e Any object
 * @returns {function} An iterator

 */
function objectAsIterator(e) {
    let done = false;
    return { 
        next() {
            return done ? doneIter : (done=true, { done: false, value: e })
        }
    }
}

export default Iter;
