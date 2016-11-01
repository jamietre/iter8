
const _iterator = Symbol();
const _orders = Symbol();
const _root = Symbol();

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

    const iterator = source && source[Symbol.iterator];
    if (source && !iterator) {
        if (typeof source === 'object') {
            return Iter.fromObjectOwn(source);
        }
        throw new Error('iter can only be sourced with an Iterable object or a regular Javascript object.');
    } 
    this[_iterator]=iterator ? iterator.bind(source) : emptyIterator;
}

Object.assign(Iter, {
    fromIterator:  function(iterator) {
        return new Iter(_iterator, iterator);
    },
    fromObject: function(obj, filter) {
          return new Iter(_iterator, makeObjectIterator.call(this, obj, filter, false));
    },
    fromObjectOwn: function(obj, filter) {
          return new Iter(_iterator, makeObjectIterator.call(this, obj, filter, true));
    }
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
    /**
     * Return a single element that is the return value of a function invoked for 
     * each element in the input sequence 
     * 
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A transformed sequence 
     */    
    map(cb, thisArg) {
        return new Iter(_iterator, makeMapIterator.call(this,cb, thisArg));
    },
    filter(cb, thisArg) {
        return new Iter(_iterator, makeFilterIterator.call(this,cb, thisArg));
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
        let iterator =  getIterator.call(this);
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
        return new Iter(_iterator, makeMapIterator.call(this, cast(Type)));
    },
    first() {
        let cur = getIterator.call(this).next()
        return cur.done ? undefined : cur.value;
    },
    last() {
        let iterator = getIterator.call(this);
        let cur = iterator.next()
        if (cur.done) {
            return undefined;
        } else {
            let last;
            while (cur = iterator.next(), !cur.done) {
                last = cur.value;    
            }
            return last;
        }
    },
    // todo: add recurse option
    flatten() {
        return new Iter(_iterator, makeFlattenIterator.call(this));
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
    repeat(obj, times) {
        return new Iter(_iterator, makeRepeatIterator.call(this, obj, times));
    },
    concat() {
        return new Iter(_iterator, makeConcatIterator.call(this, arguments));
    },
    some(cb, thisArg) {
        let iterator = getIterator.call(this);
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
        let iterator = getIterator.call(this);
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
        let iterator = getIterator.call(this);
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
        let iterator = getIterator.call(this);
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
        let iterator = getIterator.call(this);
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
    find(cb, thisArg) {
        return findHelper.call(this, cb, thisArg)[1];
    },
    get(getIndex) {
        let iterator = getIterator.call(this);
        let cur;
        let index = 0;
        while (cur = iterator.next(), !cur.done && index < getIndex)  index++;
        
        return cur.done ? undefined : cur.value; 
    },
    value() {
        return this.get(0)
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
        let iterator = getIterator.call(this);
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
            [Symbol.iterator]: this[_iterator]
        });
    },
    /**
     * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
     * as in Iter object for further processing.
     * 
     * @returns {Iter} a new Iter object
     */
    execute() {
        // todo: spit this into 'iterate' (whcih returns a sequence) and
        // 'execute' which does not? (e.g. if we just want side effects, no 
        // need to return an array)

        return new Iter(this.toArray());
    },
    min() {
        return Math.min.apply(null, this.toArray());
    },
    max() {
        return Math.max.apply(null, this.toArray());
    },
    sum() {
        let iterator = getIterator.call(this);
        let cur;
        let total = 0;
        while (cur = iterator.next(), !cur.done) total+=cur.value;
        return total;
    },
    // average: function() {
    // throw new error('not implemented')    
    // },

    [Symbol.iterator]() {
        return this[_iterator]();
    }
};

// These methods require traversing the entire array so just make them into an array
['sort', 'reverse'].forEach((method)=> {
    Iter.prototype[method]=function() {
        var that = this;
        var args = arguments;
        return new Iter(_iterator, function() {
            let arr = that.toArray(); 
            return arrProto[method].apply(arr,args)[Symbol.iterator]();
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

function skipIterable(n) {
    var that = this;
    return function() {
        let iterator = getIterator.call(that);
        while (n-- > 0 && !iterator.next().done) ;
        return iterator;
    } 
}

function takeIterable(n) {
    var that = this;
    return function() {
        let iterator = getIterator.call(that);
        return {
            next: function() {
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
    let sourceIter = getIterator.call(this);
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
        
        return sorted[Symbol.iterator]();
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
        let sourceIter = props[Symbol.iterator]();

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
        let sourceIter = getIterator.call(that);

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
        let sourceIter = getIterator.call(that);
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

function makeRepeatIterator(obj, times) {
    return function() {
        return {
            next() {
                return iterResult(times--<=0, obj)
            }
        } 
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
                let value;
                while (!value && index < sources.length) {
                    if (!iterator) {
                        const source = sources[index];
                        if (!source[Symbol.iterator]) {
                            value = source;
                            index++;
                            break;
                        }
                        iterator = source[Symbol.iterator]();  
                    }

                    let cur = iterator.next();
                    if (cur.done) {
                        iterator=null;
                        index++;
                    } else {
                        value = cur.value;
                    }
                }

                return iterResult(sources.length<=index, value)
            }
        }        
    }
}

function makeUniqueIterator() {
    var that = this;
    return function() {
        let used = new Set();
        let iterator = getIterator.call(that);
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
        let iterator = getIterator.call(that);
        while (cur = iterator.next(), !cur.done) {
            let e = cur.value;
            let key = cb(e);
            if (dict.has(key)) {
                dict.get(key).push(e);
            } else {
                dict.set(key, [e]);
            }
        }

        return dict[Symbol.iterator]();
    }
}

function makeFlattenIterator() {
    var that =this;
    return function() {
        let sourceIter = getIterator.call(that);
        let iter=sourceIter;

        return {
            next: ()=> {
                let value = null;
                while(!value) {
                    const isSource = iter === sourceIter;
                    let cur = iter.next();
                    if (cur.done) {
                        if (!isSource) {
                            iter = sourceIter;
                        } else {
                            return doneIter
                        }
                    } else {
                        if (isSource && cur.value[Symbol.iterator]) {
                            iter = cur.value[Symbol.iterator]();
                        } else {
                            value = cur.value;
                        }
                    }
                }

                return {
                    done: false,
                    value: value    
                }
            }
        }
    }
}

function makeFilterIterator(cb, thisArg) {
    var that = this;
    return function() {
        let index = 0;
        let sourceIter = getIterator.call(that);

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
function findHelper(cb, thisArg) {
    let iterator = getIterator.call(this);
    let cur;
    let index = 0;
    while (cur = iterator.next(), !cur.done) {
        if (cb.call(thisArg, cur.value)) {
            return [index, cur.value];
        }
        index++;
    }
    return [-1, undefined];
}

function emptyIterator() {
    return function() {
        return doneIter
    }
}

function cast(Type) {
    return function(e) {
        return new Type(e);
    }
}


function getIterator() {
    return this[_iterator]();
}

export default Iter;
