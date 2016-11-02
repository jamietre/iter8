
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

/**
* Creates an instance of Iter from an Iterable object, or a plain Javascript object.
* 
* @param {*} source
* @returns {Iter} An Iter instance
*/
function iter(source: any): Iter {
    return new Iter(source);
}
namespace iter {
    /**
     * Create an Iter from an generator (a function returning an iterator)
     * @param {generator} generator The generator function
     * @returns {Iter} an Iter instance 
     */
    export let fromGenerator = function(generator: ()=>Iterator<any>) {
        return new Iter(_iterator, generator);
    }
    /**
     * Create an Iter from an object, returning a seqeunce of [key, value] pairs obtained
     * by enumerating the object's properties. All properties, including those on the prototype
     * chain, will be included, except "constructor"
     * 
     * @param {any} obj An object
     * @param {function} filter A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
     * @returns {Iter} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
     */
    export let fromObject = function(obj, filter?: (prop: string, index: number)=>boolean): Iter {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, false));
    }
    /**
     * Create an Iter from an object, returning a seqeunce of [key, value] pairs obtained
     * by enumerating the object's properties. Only the object's own properties (e.g. no prototype chain)
     * are included.
     * 
     * @param {any} obj An object
     * @param {function} filter A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
     * @returns {Iter} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
     */
    export let fromObjectOwn = function(obj: any, filter?: (prop: string, index: number)=>boolean): Iter {
          return new Iter(_iterator, makeObjectIterator.call(null, obj, filter, true));
    } 
    /**
     * Generate a sequence from a `function(n)` invoked `times` times, or by repeating a single value.
     * 
     * @param {any} obj An object to repeat, or a `function(n)` that returns an object.
     * @param {number} times The number of times to invoke the generator or repeat
     */
    export let generate = function(obj: (index: number)=>any | any, times: number): Iter {
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
    /**
     * Creates an instance of Iter from an Iterable object, or a plain Javascript object.
     * 
     * @param {*} source
     * @param {()=>Iterator<any>} [_iter]
     */
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
    /**
     * Group each element in the sequence according to the value of a property if `group` is a string,
     * or the value returned by `function(item, index)` if group is a function. Returns a sequence
     * of `[key, value]` pairs where `value` is an array containing each item in the group.  
     * 
     * @param {((item: any, index: number)=>any | string)} group A property name or function
     * @returns {Iter} A sequence of `[key, value[]]` pairs where `value` is an array of items in the group 
     */
    groupBy(group: (item: any, index: number)=>any | string): Iter {
        return new Iter(_iterator, makeGroupByIterator.call(this, group))
    }
    /**
     * Sort by the value of a property, if `order` is a string, or by the value returned by a
     * `function(item, index)` if `order` is a function
     * 
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */
    orderBy(order: (item: any, index: number)=>any | string): Iter {
        return orderBy.call(this, order)
    }
    /**
     * Sort by the value of a property, in descending order. If `order` is a string, or by the value returned by a
     * `function(item, index)` if `order` is a function
     * 
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */
    orderDesc(order: (item: any, index: number)=>any | string): Iter {
        return orderBy.call(this, order, true)
    }
    /**
     * Add a secondary or n-ary sort order if there are multiple items with the same value. Can only follow an `order` or `then` clause.
     * 
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */    
    thenBy(order: (item: any, index: number)=>any | string): Iter {
        return thenBy.call(this, order)
    }
    /**
     * Add a secondary or n-ary descending sort order if there are multiple items with the same value. Can only follow an `order` or `then` clause.
     * 
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */    
    thenDesc(order: (item: any, index: number)=>any | string, desc): Iter {
        return thenBy.call(this, order, desc)
    }
    /**
     * Iterate over the entire sequence and count the items
     * 
     * @returns {number} The number of items in the sequence
     */
    count(): number {
        let count: number=0;
        let iterator:Iterator<any> = this[_iterator]()
        while (!iterator.next().done) count++;
        return count;
    }
    /**
     * Skip `n` items in the seqeunce, and return a new sequence of all successive items.
     * 
     * @param {number} n The number of items to skip
     * @returns {Iter} A sequence of all items after the skipped ones
     */
    skip(n: number): Iter {
        return new Iter(_iterator, skipIterable.call(this, n));
    }
    /**
     * Create a seqeunce of the next `n` items
     * 
     * @param {number} n the number of items to take
     * @returns {Iter} a sequence of the taken items
     */
    take(n: number): Iter {
        return new Iter(_iterator, takeIterable.call(this, n));
    }
    /**
     * Convert all items in the sequence to instances of `Type` by invoking `Type` as a constructor with the sequence as an argument
     * 
     * @param {new (element: any)=>any} Type the Constructor to use
     * @returns {Iter} The new sequence
     */
    cast(Type: new (element: any)=>any ): Iter {
        return new Iter(_iterator, makeMapIterator.call(this, function(e) {
            return new Type(e);
        }));
    }
    /**
     * Return the first item in the sequence, or `undefined`, or an optional `defaultValue`
     * 
     * @param {*} [defaultValue] a default value to return if the seqeunce has no items.
     * @returns {*} The first item in the sequence, or `undefined` (or `defaultValue`) if the sequence has no items. 
     */
    first(defaultValue?: any):any {
        let cur = this[_iterator]().next()
        return cur.done ? defaultValue : cur.value;
    }
    /**
     * Return the firlastst item in the sequence, or `undefined`, or an optional `defaultValue`
     * 
     * @param {*} [defaultValue] a default value to return if the seqeunce has no items.
     * @returns {*} The first item in the sequence, or `undefined` (or `defaultValue`) if the sequence has no items. 
     */
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
    /**
     * Return a new sequence created by expanding any iterable elements in the original sequence into their component elements.
     * 
     * @param {boolean} [recurse] when true, recurse into inner iterable elements and add their component elements to the seqeunce too
     * @returns {Iter} a new sequence of all elements within inner sequences
     */
    flatten(recurse?: boolean): Iter {
        return new Iter(_iterator, makeFlattenIterator.call(this, recurse));
    }
    
    /**
     * Return a sequence with only one occurrence of each distinct value in the seqeunce
     * 
     * @returns {Iter} a sequence of unique values
     */
    unique(): Iter {
        return new Iter(_iterator, makeUniqueIterator.call(this));
    }
    /**
     * Return a sequence that excludes any members also found in the other `sequence` 
     * 
     * @param {Iterable<any>} sequence the sequence of values to exclude
     * @returns {Iter} the new sequence
     */
    except(sequence: Iterable<any>): Iter {
        return new Iter(_iterator, makeExceptIterator.call(this, sequence));
    }
    /**
     * Return a sequence that includes only members found in the original and the other `sequence`
     * 
     * @param {Iterable<any>} sequence the sequence of values to intersect
     * @returns {Iter} the new sequence
     */
    intersect(sequence: Iterable<any>): Iter {
        return new Iter(_iterator, makeIntersectIterator.call(this, sequence));
    }
    /**
     * Return a new sequence containing all values found in either sequence
     * 
     * @param {Iterable<any>} sequence the sequence of values to union 
     * @returns {Iter} the new sequence
     */
    union(sequence: Iterable<any>): Iter {
        let extra = new Iter(sequence).except(this);
        return this.concat(extra);
    }
    /**
     * Given a sequence of [key, value] pairs, join another sequence of [key, value] pairs on
     * `key`, and invoke `mergeCallback` for each matched pair. Create a new sequence that contains
     * an element for each key in the original seqeunce, and a value from the `mergeCallback`. this
     * operation assumes the keys are unique, and there will be only one element for each key in the 
     * resulting sequence. Any keys found only in the right sequence will be ommitted (left join).
     *
     * You can add a `joinOn` clause to specify the keys and values on which to merge, if your input
     * is not in the form of `[key, value]` pairs. When `joinOn` is used, there can be multiple rows
     * for each key, if there are duplicates in the left or right sequences.
     * 
     * @param {Iterable<any>} sequence the "right" sequence to join
     * @param {(left: any, right: any, key: any)=> any} mergeCallback the callback to create the merged value for each match
     * @returns a sequence of [key, value] pairs
     */
    leftJoin(sequence: Iterable<any>, mergeCallback: (left: any, right: any, key: any)=> any) {
        let iter =  new Iter(_iterator, makeLeftJoinIterator.call(this, sequence, mergeCallback));
        iter[_join] = arguments;
        iter[_root] = this;
        return iter;
    }
    /**
     * Specify how a leftJoin should be performed by providing a callback function for each element in the left and right sequences
     * that should return the key on which to merge.
     * 
     * @param {(item: any)=>any} mapLeft a function that returns a key from the original sequence
     * @param {(item: any)=>any} mapRight a function that returns a key from the "right" sequence
     * @returns a sequence of [key, value] pairs
     */
    joinOn(mapLeft: (item: any)=>any, mapRight: (item: any)=>any) {
        if (!this[_join]) throw new Error(`"on" doesn't make sense without a join`)
        return new Iter(_iterator, makeLeftJoinIterator.call(this[_root], this[_join][0], this[_join][1], mapLeft, mapRight));
    }
    /**
     * Test whether two seqeunces are equal, meaning they are the same lengths and each item at the same position in each sequence is equal.
     * 
     * @param {Iterable<any>} sequence the other sequence to test
     * @returns {boolean} `true` if equal, `false` if not
     */
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
    /**
     * Create a new seqeunce by concanating this sequence with all elements in all other sequences or elements passed by argument.
     * Any iterable objects will be iterated over; not-iterable objects will be appended. Strings are always consdered non-iterable.
     *  
     * @param {...any[]} args the objects and/or seqeunces to append
     * @returns {Iter} the resulting sequence
     */
    concat(...args: any[]): Iter {
        return new Iter(_iterator, makeConcatIterator.call(this, args));
    }
    /**
     * Return a sequence that is generated from the return values of a function invoked for 
     * each element in the input sequence 
     * 
     * @param {function} callback the callback(element, index)
     * @param {any} thisArg the "this" context applied to the callback
     * @returns {Iter} the transformed sequence 
     */    
    map(callback: (item: any, index: number)=>any, thisArg?: any): Iter {
        return new Iter(_iterator, makeMapIterator.call(this, callback, thisArg));
    }
    /**
     * Return a sequence that contains only elements for which the `callback(item, index)` function
     * when invoked on each element, returns `true`.
     * 
     * @param {(item: any, index: number)=>any} callback the filter callback
     * @param {*} [thisArg] the "this" context applied to the callback
     * @returns {Iter} the filtered seqeunce
     */
    filter(callback: (item: any, index: number)=>any, thisArg?: any): Iter {
        return new Iter(_iterator, makeFilterIterator.call(this, callback, thisArg));
    }
    /**
     * Test whether any elements in the sequence meet a condition 
     * 
     * @param {(item: any, index: number)=>boolean} callback the function to invoke on each element to test
     * @param {*} [thisArg] the "this" context applied to the callback
     * @returns {boolean} `true` if at least one element met the condition
     */
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
    /**
     * Test whether all elements in the sequence meet a condition 
     * 
     * @param {(item: any, index: number)=>boolean} callback the function to invoke on each element to test
     * @param {*} [thisArg] the "this" context applied to the callback
     * @returns {boolean} `true` if all elements met the condition
     */
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
    /**
     * Test whether the specified item is found in the sequence
     * 
     * @param {*} item the item to search for
     * @returns {boolean} `true` if the item is found, `false` if not
     */
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
    /**
     * Locate the ordinal position (0-based) of an item in the sequence
     * 
     * @param {*} item the item to locate
     * @returns {number} 0-based position in the seqeunce, or -1 if it was not found
     */
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
    /**
     * Locate the last ordinal position (0-based) of an item in the sequence
     * 
     * @param {*} item the item to locate
     * @returns {number} 0-based position of the last occurrence in the seqeunce, or -1 if it was not found
     */    
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
    /**
     * Locate the index of an element meeting the condition specified by the callback function, which
     * should return `true` when the condition has been met
     * 
     * @param {(item: any, index: number)=>boolean} callback the function to invoke for each element
     * @param {*} thisArg the "this" context to apply to the callback
     * @returns {number} 0-based position in the sequence, or -1 if the condition was not met
     */
    findIndex(callback: (item: any, index: number)=>boolean, thisArg?: any): number {
        return findHelper.call(this, callback, thisArg)[0];
    }
    /**
     * Locate in item in the sequence meetioing the condition specified by the callback function, which
     * should return `true` when the condition has been met. If the condition is not met, return
     * `undefined`, or `defaultValue` if provided.
     * 
     * @param {(item: any, index: number)=>boolean} callback
     * @param {*} [thisArg] the "this" context to apply to the callback
     * @param {*} [defaultValue] the default value to return if the condition is never met
     * @returns {*} the found item, or `undefined`, or `defaultValue`
     */
    find(callback: (item: any, index: number)=>boolean, thisArg?: any, defaultValue?: any): any {
        return findHelper.call(this, callback, thisArg, defaultValue)[1];
    }
    /**
     * Return the element at the specified 0-based position in the sequence, or `undefined`
     * if the sequence has fewer than 
     * 
     * @param {number} index the position of the item to return
     * @param {*} [defaultValue] a value to return if the index was out of range
     * @returns {*} the item at the specified position, or `undefined`, or `defaultValue`
     */
    get(index: number, defaultValue?: any): any {
        let iterator = this[_iterator]()
        let cur;
        let i = 0;
        while (cur = iterator.next(), !cur.done && i < index)  i++;
        
        return cur.done ? defaultValue : cur.value; 
    }
    /**
     * Return a subset of the sequence starting at 0-based position `begin` and ending at position `end`
     * 
     * @param {number} begin the starting position
     * @param {number} end the ending position
     * @returns {Iter} the subsetted sequence
     */
    slice(begin: number, end: number): Iter {
        return this.skip(begin).take(end-begin+1);
    }
    /**
     * Reduce the sequence to a single element.
     * 
     * @param {(last: any, current: any, index: number)=>any} callback a function invoked for each element, that must return the memoized payload that is passed to the next invocation
     * @param {*} initial the initial payload
     * @returns {*} the final payload
     */
    reduce(callback: (last: any, current: any, index: number)=>any, initial: any): any {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduce(callback, initial);
    }
    /**
     * a function invoked for each element, in reverse order, that must return the memoized payload that is passed to the next invocation
     * 
     * @param {(last: any, current: any, index: number)=>any} callback
     * @param {*} initial the initial payload
     * @returns {*} the final payload
     */
    reduceRight(callback: (last: any, current: any, index: number)=>any, initial: any): any {
        // Entire array must be traversed, but this might be optimized if we 
        // implement it ourselves to avoid two loops through the array
        return this.toArray().reduceRight(callback, initial);
    }
    /**
     * Return a string formed by joining each element in the sequence with a separator
     * 
     * @param {any} separator the separator, defaults to ','
     * @returns a string of the joined sequence
     */
    join(separator) {
        return this.toArray().join(separator);
    }
    /**
     * Given a seqeunce of [key, value] pairs, create an object with {property: value} for each pair.
     * 
     * @returns {*} the object
     */
    toObject(): any {
        let obj={};
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            obj[cur.value[0]]=cur.value[1]
        }
        return obj;
    }
    /**
     * Craeate an array with each element in the seqeunce.
     * 
     * @returns {any[]} the array
     */
    toArray(): any[] {
        let arr = [];
        let iterator = this[_iterator]()
        let cur;
        while (cur = iterator.next(), !cur.done) {
            arr.push(cur.value);
        }
        return arr;
    }
    /**
     * Create an instance of `Type` from the sequence.
     * 
     * @param {new (element: any)=>any} Type The constructor for Type
     * @returns {*} An instance of `Type` 
     */
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
    /**
     * Sort the sequence using default comparison operator. If a `callback` is provided, then 
     * it will use the return value to determine priority when comparing two elements `a` and `b`: 
     * -1 means a<b, 1 means b<a
     * 
     * @param {(a: any, b: any)=>number} callback the comparison callback
     * @returns {Iter} the sorted sequence
     */
    sort(callback?: (a: any, b: any)=>number): Iter {
        return deferToArrayProto("sort")
    }
    /**
     * Reverse the order of elements in the sequence
     * 
     * @returns the reversed sequence
     */
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
