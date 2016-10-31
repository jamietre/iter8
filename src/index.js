
const _source = Symbol();

function Iter(source) {
     if (!(this instanceof Iter)) {
        return new Iter(source)
    }
    if (source && !source[Symbol.iterator]) {
        throw new Error('iter can only be sourced with an Iterable object');
    }
    this[_source]=source || [];
}
Iter.prototype = {
    constructor: Iter,
    /**
     * forEach iterates through each item on the list. Returning "false" from the callback will stop iterating.
     * @param {function} cb The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} the same iterator 
     */
    forEach: function(cb, thisArg) {
        let iterator = getIterator.call(this);
        let cur;
        let index=0;
        while (cur = iterator.next(), !cur.done) {
            if (cb.call(thisArg, cur.value, index++) === false) {
                return;
            }
        }
        return this;
    },
    map: function(cb, thisArg) {
        return new Iter(makeIterable(makeMapIterator.call(this,cb, thisArg)));
    },
    filter: function(cb, thisArg) {
        return new Iter(makeIterable(makeFilterIterator.call(this,cb, thisArg)));
    },
    groupBy: function(group) {
        return new Iter(makeIterable(makeGroupByIterator.call(this, group)))
    },
    count: function() {
        let count=0;
        let iterator =  getIterator.call(this);
        while (!iterator.next().done) count++;
        return count;
    },
    skip: function(n) {
        return new Iter(makeIterable(skipIterable.call(this, n)));
    },
    // skipWhile: function(/*cb*/) {
    //     throw new Error('not implemented')
    // },
    take: function(n) {
        return new Iter(makeIterable(takeIterable.call(this, n)));
    },
    // takeWhile: function(/*cb*/) {
    //     throw new Error('not implemented')
    // },
    cast: function(Type) {
        return new Iter(makeIterable(makeMapIterator.call(this, cast(Type))));
    },
    first: function(Def) {
        let cur = getIterator.call(this).next()
        return cur.done ? orDefault(Def) : cur.value;
    },
    last: function(Def) {
        let iterator = getIterator.call(this);
        let cur = iterator.next()
        if (cur.done) {
            return orDefault(Def);
        } else {
            let last;
            while (cur = iterator.next(), !cur.done) {
                last = cur.value;    
            }
            return last;
        }
    },
    // todo: add recurse option
    flatten: function() {
        return new Iter(makeIterable(makeFlattenIterator.call(this)));
    },
    // todo: equality comparitor callback.
    unique: function() {
        return new Iter(makeIterable(makeUniqueIterator.call(this)));
    },
    except: function(sequence) {
        return new Iter(makeIterable(makeExceptIterator.call(this, sequence)));
    },
    intersect(sequence) {
        return new Iter(makeIterable(makeIntersectIterator.call(this, sequence)));
    },
    repeat(obj, times) {
        return new Iter(makeIterable(makeRepeatIterator.call(this, obj, times)));
    },
    concat: function() {
        return new Iter(makeIterable(makeConcatIterator.call(this, arguments)));
    },
    some: function(cb, thisArg) {
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
    every: function(cb, thisArg) {
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
    includes: function(el) {
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
    reduce: function(callback, initial) {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduce(callback, initial);
    },
    reduceRight: function(callback, initial) {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduceRight(callback, initial);
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
    toArray: function() {
        let arr = [];
        let iterator = getIterator.call(this);
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
        return new Cotr(this[_source]);
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

    [Symbol.iterator]: function() {
        return this[_source][Symbol.iterator]();
    }
};

// These methods require traversing the entire array so just make them into an array
['sort', 'reverse', 'join'].forEach((method)=> {
    Iter.prototype[method]=function() {
        return new Iter(Array.prototype[method].apply(this.toArray(), arguments));
    }
})


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
function orDefault(Def) {
     if (Def === Error) {
        throw new Error('The sequence has no elements')
    } else {
        return Def;
    }
}

function makeIterable(iterator) {
    return {
        [Symbol.iterator]: iterator
    }
}

function cast(Type) {
    return function(e) {
        return new Type(e);
    }
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
                return {
                    done: true
                }
            }
        }
    } 
}

function getNext(condition) {
    let sourceIter = getIterator.call(this);
    return {    
        next: ()=> {
            
            let cur = sourceIter.next();
            while (!cur.done && !condition(cur)) {
                cur = sourceIter.next();
            }
            return iterResult(cur.done, cur.value);
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
            next: function() {
                return iterResult(times--<=0, obj)
            }
        } 
    }
}

function makeConcatIterator(args) {
    var that = this;
    return function() {
        const sources = [that];
        Array.prototype.forEach.call(args, function(arg) {
            sources.push(arg);
        })

        let index = 0;
        let iterator;

        return {
            next: function() {
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
                return {
                    done: true
                }
            }
        }
        
    }
}

function makeGroupByIterator(group) {
    var that = this;
    return function() {
        const cb = typeof group === 'string' ?
            function(e) {
                return e[group]
            } :
            group;

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
                            return {
                                done: true
                            }
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
        let sourceIter = getIterator.call(that);

        return {
            next: ()=> {
                let cur = sourceIter.next();
                return iterResult(cur.done, !cur.done && cb.call(thisArg, cur.value, index++))
            }
        }
    }
}

function iterResult(done, value) {
    if (!done) {
        return {
            value: value,
            done: false
        }
    } else {
        return {
            done: true
        }
    }
}

function getIterator() {
    return this[_source][Symbol.iterator]();
}

export default Iter;
