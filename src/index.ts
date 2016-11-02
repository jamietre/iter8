
const _orders = Symbol();
const _root = Symbol();
const _join = Symbol();
const _iterator = Symbol();
const arrProto = Array.prototype;
const doneIter = {
    done: true,
    value: undefined
}
Object.freeze(doneIter)

function iter(source: any): Iter {
    return new Iter(source);
}
namespace iter {
    /**
     * Create an Iter from an Iterator (a function returning { next() })
     */
    export let fromGenerator = function(generator: ()=>Iterator<any>) {
        return new Iter(_iterator, generator);
    }
    export let fromObject = function(obj, filter?: (prop: string, index: number)=>boolean): Iter {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, false));
    }
    export let fromObjectOwn = function(obj: any, filter?: (prop: string, index: number)=>boolean): Iter {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, true));
    } 
    export let repeat = function(obj: any, times: number): Iter {
        return new Iter(_iterator, function() {
            return {
                next() {
                    return iterResult(times--<=0, obj)
                }
            } 
        });
    }
}  

export class Iter implements Iterable<any> {
    
    constructor(source: any, _iter?: ()=>Iterator<any>) {
        if (source === _iterator) {
            this[_iterator] = _iter;
            return;
        }
        
        const iterator = source && source[_iterator];
        if (source && !iterator) {
            if (typeof source === 'object') {
                return iter.fromObjectOwn(source);
            }
            throw new Error('iter can only be sourced with an Iterable object or a regular Javascript object.');
        } 
        this[_iterator]=iterator ? iterator.bind(source) : emptyIterator;
    }
    // this kind of sucks, since we should be able to just assign to [Symbol.iterator]
    // property and avoid an extra fn call.. but TS won't have it

    [Symbol.iterator]() {
        return this[_iterator];
    }
    /**
     * forEach is the same as do(), but executes the query immediately.
     * 
     * @param {function} callback The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {void} 
     */
    forEach(callback:(item: any, index: number)=>void, thisArg?: any): void {
        new Iter(_iterator, makeForEachIterator.call(this,callback, thisArg)).execute()
    }
     /**
     * Execute a callback for each element in the seqeunce, and return the same
     * element. 
     * 
     * @param {function} callback The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} a seqeunce identical to the input sequence 
     */
    do(callback:(item: any, index: number)=>any, thisArg?: any): Iter {
        return new Iter(_iterator, makeDoIterator.call(this, callback, thisArg));
    }
    groupBy(group: (item: any, index: number)=>any | string): Iter {
        return new Iter(_iterator, makeGroupByIterator.call(this, group))
    }

    orderBy(order: (item: any, index: number)=>any | string): Iter {
        return orderBy.call(this, order)
    }
    orderDesc(order: (item: any, index: number)=>any | string): Iter {
        return orderBy.call(this, order, true)
    }
    thenBy(order: (item: any, index: number)=>any | string): Iter {
        return thenBy.call(this, order)
    }
    thenDesc(order: (item: any, index: number)=>any | string, desc): Iter {
        return thenBy.call(this, order, desc)
    }
    count(): number {
        let count: number=0;
        let iterator:Iterator<any> = this[_iterator]()
        while (!iterator.next().done) count++;
        return count;
    }
    skip(n: number): Iter {
        return new Iter(_iterator, skipIterable.call(this, n));
    }
    // skipWhile: function(/*cb*/) {
    //     throw new Error('not implemented')
    // },
    take(n: number): Iter {
        return new Iter(_iterator, takeIterable.call(this, n));
    }
    // takeWhile: function(/*cb*/) {
    //     throw new Error('not implemented')
    // },
    cast(Type: new (element: any)=>any ): Iter {
        return new Iter(_iterator, makeMapIterator.call(this, function(e) {
            return new Type(e);
        }));
    }
     
    first(defaultValue?: any):any {
        let cur = this[_iterator]().next()
        return cur.done ? defaultValue : cur.value;
    }
    last(defaultValue?: any):any {
        let iterator = this[_iterator]()
        let cur = iterator.next()
        if (cur.done) {
            return defaultValue;
        } else {
            let last;
            while (cur = iterator.next(), !cur.done) {
                last = cur.value;    
            }
            return last;
        }
    }
    flatten(recurse?: boolean): Iter {
        return new Iter(_iterator, makeFlattenIterator.call(this, recurse));
    }
    
    // todo: equality comparitor callback.
    unique(): Iter {
        return new Iter(_iterator, makeUniqueIterator.call(this));
    }
    except(sequence: Iterable<any>): Iter {
        return new Iter(_iterator, makeExceptIterator.call(this, sequence));
    }
    intersect(sequence: Iterable<any>): Iter {
        return new Iter(_iterator, makeIntersectIterator.call(this, sequence));
    }
    union(sequence: Iterable<any>): Iter {
        let extra = new Iter(sequence).except(this);
        return this.concat(extra);
    }
    leftJoin(sequence: Iterable<any>, mergeCallback: (left: any, right: any, key: any)=> any) {
        let iter =  new Iter(_iterator, makeLeftJoinIterator.call(this, sequence, mergeCallback));
        iter[_join] = arguments;
        iter[_root] = this;
        return iter;
    }
    joinOn(mapLeft: (item: any)=>any, mapRight: (item: any)=>any) {
        if (!this[_join]) throw new Error(`"on" doesn't make sense without a join`)
        return new Iter(_iterator, makeLeftJoinIterator.call(this[_root], this[_join][0], this[_join][1], mapLeft, mapRight));
    }
    sequenceEqual(sequence: Iterable<any>): boolean {
        let iter = this[_iterator]();
        let cur;
        for (var other of sequence) {
            cur = iter.next();
            if (cur.done || other !== cur.value) return false; 
        }

        if (!iter.next().done) return false;
        return true;
    }
    concat(...args: any[]): Iter {
        return new Iter(_iterator, makeConcatIterator.call(this, args));
    }
    /**
     * Return a single element that is the return value of a function invoked for 
     * each element in the input sequence 
     * 
     * @param {function} callback The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A transformed sequence 
     */    
    map(callback: (item: any, index: number)=>any, thisArg?: any): Iter {
        return new Iter(_iterator, makeMapIterator.call(this, callback, thisArg));
    }
    filter(callback: (item: any, index: number)=>any, thisArg?: any): Iter {
        return new Iter(_iterator, makeFilterIterator.call(this, callback, thisArg));
    }
    some(callback: (item: any, index: number)=>boolean, thisArg?: any): boolean {
        let iterator = this[_iterator]()
        let cur;
        let index=0;
        while (cur = iterator.next(), !cur.done) {
            if (callback.call(thisArg, cur.value, index++)) {
                return true;
            }
        }
        return false;
    }
    every(callback: (item: any, index: number)=>boolean, thisArg?: any): boolean {
        let iterator = this[_iterator]()
        let cur;
        let index =0;
        while (cur = iterator.next(), !cur.done) {
            if (!callback.call(thisArg, cur.value, index++)) {
                return false;
            }
        }
        return true;
    }
    includes(item: any): boolean {
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            if (cur.value===item) {
                return true;
            }
        }
        return false;
    }
    indexOf(item: any): number {
        let iterator = this[_iterator]()
        let cur;
        let index = 0;
        while (cur = iterator.next(), !cur.done) {
            if (cur.value===item) {
                return index;
            }
            index++;
        }
        return -1;
    }
    lastIndexOf(item: any): number {
        let iterator = this[_iterator]()
        let cur;
        let index = 0;
        let lastIndex = -1;
        while (cur = iterator.next(), !cur.done) {
            if (cur.value===item) {
                lastIndex = index;
            }
            index++;
        }
        return lastIndex;
    }
    
    findIndex(callback: (item: any, index: number)=>boolean, thisArg: any): number {
        return findHelper.call(this, callback, thisArg)[0];
    }
    find(callback: (item: any, index: number)=>boolean, thisArg?: any, defaultValue?: any): any {
        return findHelper.call(this, callback, thisArg, defaultValue)[1];
    }
    get(getIndex: number, defaultValue?: any): any {
        let iterator = this[_iterator]()
        let cur;
        let index = 0;
        while (cur = iterator.next(), !cur.done && index < getIndex)  index++;
        
        return cur.done ? defaultValue : cur.value; 
    }
    value(): any {
        return this.get(0)
    }
    slice(begin: number, end: number): Iter {
        return this.skip(begin).take(end-begin+1);
    }
    reduce(callback: (last: any, current: any, index: number)=>any, initial: any): any {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduce(callback, initial);
    }
    reduceRight(callback: (last: any, current: any, index: number)=>any, initial: any): any {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduceRight(callback, initial);
    }
    
    join(separator) {
        return this.toArray().join(separator);
    }
    toObject(): any {
        let obj={};
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            obj[cur.value[0]]=cur.value[1]
        }
        return obj;
    }
    toArray(): any[] {
        let arr = [];
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            arr.push(cur.value);
        }
        return arr;
    }
    as(Type: new (element: any)=>any): any {
        if (Type === Array) {
            return this.toArray();
        }
        return new Type({
            [_iterator]: this[_iterator]
        });
    }
    /**
     * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
     * as in Iter object for further processing.
     * 
     * @returns {Iter} a new Iter object
     */
    execute(): Iter {
        return new Iter(this.toArray());
    }
    /**
     * Return the minimum value in the sequence
     * TODO: Can't really use Math for this if we want to return "any"
     * 
     * @param {function} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The minimum value 
     */
    min(mapCallback?: (item: any, index: any) => any): any {
        return Math.min.apply(null, (mapCallback ? this.map(mapCallback) : this).toArray());
    }

    /**
     * Return the maximum value in the sequence
     * 
     * @param {function} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The maximum value 
     */
    max(mapCallback?: (item: any, index: any) => any): any {
        return Math.max.apply(null, (mapCallback ? this.map(mapCallback) : this).toArray());
    }
    /**
     * Return the sum of all elements in the sequence
     * 
     * @param {any} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The sum of all elements in the sequence (using the + operator)
     */
    sum(mapCallback?: (item: any, index: any) => any): any {
        let iterator = this[_iterator]()
        let cur: IteratorResult<any>;
        let total = 0;
        let index: number = 0;
        while (cur = iterator.next(), !cur.done) total+=mapCallback ? mapCallback(cur.value, index) : cur.value;
        return total;
    }
    sort(callback: (a: any, b: any)=>number): Iter {
        return deferToArrayProto("sort")
    }
    reverse() {
        return deferToArrayProto("reverse")
    }
}

function deferToArrayProto(method: string): Iter {
    var that = this;
    var args = arguments;
    return new Iter(_iterator, function() {
        let arr = that.toArray(); 
        return arrProto[method].apply(arr,args)[_iterator]();
    });

}

  
function orderBy(order, desc): ()=>Iterator<any> {
    let orders=[orProp(order)];
    return orderByHelper.call(this, this, orders, desc)
}

function thenBy(order, desc): ()=>Iterator<any> {
    if (!this[_orders]) throw new Error("thenBy only makes sense after orderBy")
    let orders = this[_orders].slice(0);
    orders.push(orProp(order))
    return orderByHelper.call(this, this[_root], orders, desc)
}

function orderByHelper(root, orders, desc): Iter {
    let seq =  new Iter(_iterator, makeOrderByIterator.call(this, orders, desc));
    seq[_orders] = orders;
    seq[_root] = root
    return seq;
}

function makeOrderByIterator(orders, desc): ()=>Iterator<any> {
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
function makeLeftJoinIterator(sequence, mergeFn, mapLeft, mapRight): ()=>Iterator<any> {
    var that = this;
    return function() {
        let iterator = that[_iterator]();
        let other = new Map(mapRight ? new Iter(sequence).groupBy(e=>mapRight(e)) : sequence)
        let matches;
        let leftValue;
        let id;

        return {
            next(): IteratorResult<any> {
                /*eslint no-constant-condition:0 */
                while (true) {
                    if (!matches) {
                        let left = iterator.next()

                        if (left.done) return doneIter
                        id = mapLeft ? mapLeft(left.value) : left.value[0]
                        leftValue = mapLeft ? left.value : left.value[1];
                        let match = other.get(id)
                        if (!match || !match[_iterator] || typeof match === 'string') {
                            return { done: false, value: [id, mergeFn(leftValue, match, id)] }
                        }
                        matches = match[_iterator]() 
                    } 

                    // being here means the right is iterable
                    
                    let right = matches.next();
                    if (!right.done) {
                        return { done: false, value: [id, mergeFn(leftValue, mapRight ? right.value : right.value[1], id)] }
                    } else {
                        matches = null;
                    }
                }
            }
        }        
    }
}

function skipIterable(n): ()=>Iterator<any> {
    var that = this;
    return function() {
        let iterator = that[_iterator]()
        while (n-- > 0 && !iterator.next().done) ;
        return iterator;
    } 
}

function takeIterable(n): ()=>Iterator<any> {
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

function makeObjectIterator(obj, filter, ownPropsOnly/*, includeGetters*/): ()=>Iterator<any> {
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
        let finished:any = false;
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


/**
 * Make a single element iterable
 * 
 * @param {any} e Any object
 * @returns {function} An iterator

 */
function asIterator(e): Iterator<any> {
    let done = false;
    return { 
        next() {
            return done ? doneIter : (done=true, { done: false, value: e })
        }
    }
}

function makeUniqueIterator(): ()=>Iterator<any> {
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

function makeGroupByIterator(group): ()=>Iterator<any>{
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
                            asIterator(nextSource);
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


function getNext(condition): Iterator<any> {
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

function orProp(obj): (item: any)=>any {
    return typeof obj === 'function' ? 
        obj :
        function(e) {
            return e[obj];
        }
}

function iterResult(done, value): IteratorResult<any> {
    if (!done) {
        return {
            value: value,
            done: false
        }
    } else {
        return doneIter
    }
}
function findHelper(cb, thisArg, def): any[] {
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

function emptyIterator(): ()=>Iterator<any> {
    return function() {
        return {
            next() {
                return doneIter
            }
        }
    }
}

export default iter;
