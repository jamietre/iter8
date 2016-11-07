/**
* Creates an instance of Iter from an Iterable object, or a plain Javascript object.
*
* @param {*} source
* @returns {Iter} An Iter instance
*/
declare function iter(source: any): Iter;

declare namespace iter {
    /**
     * Create an Iter from an generator (a function returning an iterator)
     * @param {generator} generator The generator function
     * @returns {Iter} an Iter instance
     */
    let fromGenerator: (generator: () => Iterator<any>) => Iter;
    /**
     * Create an Iter from an object, returning a seqeunce of [key, value] 
     * pairs obtained by enumerating the object's properties. All properties, 
     * including those on the prototype chain, will be included, except 
     * constructor"
     *
     * @param {any} obj An object
     * @param {function} filter A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
     * @returns {Iter} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
     */
    let fromObject: (obj: any, filter?: (prop: string, index: number) => boolean) => Iter;
    /**
     * Create an Iter from an object, returning a seqeunce of [key, value] pairs obtained
     * by enumerating the object's properties. Only the object's own properties (e.g. no prototype chain)
     * are included.
     *
     * @param {any} obj An object
     * @param {function} filter A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
     * @returns {Iter} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
     */
    let fromObjectOwn: (obj: any, filter?: (prop: string, index: number) => boolean) => Iter;
    /**
     * Generate a sequence from a `function(n)` invoked `times` times, or by repeating a single value.
     *
     * @param {any} obj An object to repeat, or a `function(n)` that returns an object.
     * @param {number} times The number of times to invoke the generator or repeat
     */
    let generate: (obj: (index: number) => any, times: number) => Iter;
}
export declare class Iter implements Iterable<any> {
    /**
     * Creates an instance of Iter from an Iterable object, or a plain Javascript object.
     *
     * @param {*} source
     * @param {()=>Iterator<any>} [_iter]
     */
    constructor(source: any, _iter?: () => Iterator<any>);
    [Symbol.iterator](): any;
    /**
     * forEach is the same as do(), but executes the query immediately.
     *
     * @param {function} callback The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {void}
     */
    forEach(callback: (item: any, index: number) => void, thisArg?: any): void;
    /**
    * Execute a callback for each element in the seqeunce, and return the same
    * element.
    *
    * @param {function} callback The callback(element, index)
    * @param {any} thisArg The "this" context applied to the callback
    * @returns {Iter} a seqeunce identical to the input sequence
    */
    do(callback: (item: any, index: number) => any, thisArg?: any): Iter;
    /**
     * Group each element in the sequence according to the value of a property if `group` is a string,
     * or the value returned by `function(item, index)` if group is a function. Returns a sequence
     * of `[key, value]` pairs where `value` is an array containing each item in the group.
     *
     * @param {((item: any, index: number)=>any | string)} group A property name or function
     * @returns {Iter} A sequence of `[key, value[]]` pairs where `value` is an array of items in the group
     */
    groupBy(group: (item: any, index: number) => any | string): Iter;
    /**
     * Sort by the value of a property, if `order` is a string, or by the value returned by a
     * `function(item, index)` if `order` is a function
     *
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */
    orderBy(order: (item: any, index: number) => any | string): Iter;
    /**
     * Sort by the value of a property, in descending order. If `order` is a string, or by the value returned by a
     * `function(item, index)` if `order` is a function
     *
     * @param {((item: any, index: number)=>any | string)} order A property 
     *      name or function
     * @returns {Iter} The sorted sequence
     */
    orderDesc(order: (item: any, index: number) => any | string): Iter;
    /**
     * Add a secondary or n-ary sort order if there are multiple items with 
     * the same value. Can only follow an `order` or `then` clause.
     *
     * @param {((item: any, index: number)=>any | string)} order A property 
     *      name or function
     * @returns {Iter} The sorted sequence
     */
    thenBy(order: (item: any, index: number) => any | string): Iter;
    /**
     * Add a secondary or n-ary descending sort order if there are multiple 
     *      items with the same value. Can only follow an `order` or `then` clause.
     *
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */
    thenDesc(order: (item: any, index: number) => any | string, desc: any): Iter;
    /**
     * Iterate over the entire sequence and count the items
     *
     * @returns {number} The number of items in the sequence
     */
    count(): number;
    /**
     * Skip `n` items in the seqeunce, and return a new sequence of all 
     * successive items.
     *
     * @param {number} n The number of items to skip
     * @returns {Iter} A sequence of all items after the skipped ones
     */
    skip(n: number): Iter;
    /**
     * Create a seqeunce of the next `n` items
     *
     * @param {number} n the number of items to take
     * @returns {Iter} a sequence of the taken items
     */
    take(n: number): Iter;
    /**
     * Convert all items in the sequence to instances of `Type` by invoking
     *      `Type` as a constructor with the sequence as an argument
     *
     * @param {new (element: any)=>any} Type the Constructor to use
     * @returns {Iter} The new sequence
     */
    cast(Type: new (element: any) => any): Iter;
    /**
     * Return the first item in the sequence, or `undefined`, or an optional
     * `defaultValue`
     *
     * @param {*} [defaultValue] a default value to return if the seqeunce has 
     *      no items.
     * @returns {*} The first item in the sequence, or `undefined` (or 
     *      `defaultValue`) if the sequence has no items.
     */
    first(defaultValue?: any): any;
    /**
     * Return the firlastst item in the sequence, or `undefined`, or an 
     * optional `defaultValue`
     *
     * @param {*} [defaultValue] a default value to return if the seqeunce has
     *      no items.
     * @returns {*} The first item in the sequence, or `undefined` (or 
     *      `defaultValue`) if the sequence has no items.
     */
    last(defaultValue?: any): any;
    /**
     * Return a new sequence created by expanding any iterable elements in the
     * original sequence into their component elements.
     *
     * @param {boolean} [recurse] when true, recurse into inner iterable
     *      elements and add their component elements to the seqeunce too
     * @returns {Iter} a new sequence of all elements within inner sequences
     */
    flatten(recurse?: boolean): Iter;
    /**
     * Return a sequence with only one occurrence of each distinct value in
     * the seqeunce
     *
     * @returns {Iter} a sequence of unique values
     */
    unique(): Iter;
    /**
     * Return a sequence that excludes any members also found in the other
     * sequence. Can be followed by an `on` clause to specify key.
     *
     * @param {Iterable<any>} sequence the sequence of values to exclude
     * @returns {Iter} the new sequence
     */
    except(sequence: Iterable<any>): Iter;
    /**
     * Return a sequence that includes only members found in the original and
     * the other `sequence`. Can be followed by an `on` clause to specify key.
     *
     *
     * @param {Iterable<any>} sequence the sequence of values to intersect
     * @returns {Iter} the new sequence
     */
    intersect(sequence: Iterable<any>): Iter;
    /**
     * Return a new sequence containing all values found in either sequence.
     * Can be followed by an `on` clause to specify key.
     *
     * @param {Iterable<any>} sequence the sequence of values to union
     * @returns {Iter} the new sequence
     */
    union(sequence: Iterable<any>): Iter;
    /**
     * Given a sequence of [key, value] pairs, join another sequence of
     * [key, value] pairs on `key`, and invoke `mergeCallback` for each
     * matched pair. Create a new sequence that contains an element for
     * each key in the original seqeunce, and a value from the `mergeCallback`.
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
    leftJoin(sequence: Iterable<any>, mergeCallback: (left: any, right: any, key: any) => any): Iter;
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
     * @param {(item: any)=>any} mapLeft a function that returns a key from
     *    the original or "left" sequence
     * @param {(item: any)=>any} mapRight a function that returns a key from the
     *    other or "right" sequence
     * @returns a sequence of [key, value] pairs
     */
    on(mapLeft: (item: any) => any, mapRight: (item: any) => any): Iter;
    /**
     * Test whether two seqeunces are equal, meaning they are the same lengths and each item at the same position in each sequence is equal.
     *
     * @param {Iterable<any>} sequence the other sequence to test
     * @returns {boolean} `true` if equal, `false` if not
     */
    sequenceEqual(sequence: Iterable<any>): boolean;
    /**
     * Create a new seqeunce by concanating this sequence with all elements in all other sequences or elements passed by argument.
     * Any iterable objects will be iterated over; not-iterable objects will be appended. Strings are always consdered non-iterable.
     *
     * @param {...any[]} args the objects and/or seqeunces to append
     * @returns {Iter} the resulting sequence
     */
    concat(...args: any[]): Iter;
    /**
     * Return a sequence that is generated from the return values of a function invoked for
     * each element in the input sequence
     *
     * @param {function} callback the callback(element, index)
     * @param {any} thisArg the "this" context applied to the callback
     * @returns {Iter} the transformed sequence
     */
    map(callback: (item: any, index: number) => any, thisArg?: any): Iter;
    /**
     * Return a sequence that contains only elements for which the `callback(item, index)` function
     * when invoked on each element, returns `true`.
     *
     * @param {(item: any, index: number)=>any} callback the filter callback
     * @param {*} [thisArg] the "this" context applied to the callback
     * @returns {Iter} the filtered seqeunce
     */
    filter(callback: (item: any, index: number) => any, thisArg?: any): Iter;
    /**
     * Test whether any elements in the sequence meet a condition
     *
     * @param {(item: any, index: number)=>boolean} callback the function to invoke on each element to test
     * @param {*} [thisArg] the "this" context applied to the callback
     * @returns {boolean} `true` if at least one element met the condition
     */
    some(callback: (item: any, index: number) => boolean, thisArg?: any): boolean;
    /**
     * Test whether all elements in the sequence meet a condition
     *
     * @param {(item: any, index: number)=>boolean} callback the function to invoke on each element to test
     * @param {*} [thisArg] the "this" context applied to the callback
     * @returns {boolean} `true` if all elements met the condition
     */
    every(callback: (item: any, index: number) => boolean, thisArg?: any): boolean;
    /**
     * Test whether the specified item is found in the sequence
     *
     * @param {*} item the item to search for
     * @returns {boolean} `true` if the item is found, `false` if not
     */
    includes(item: any): boolean;
    /**
     * Locate the ordinal position (0-based) of an item in the sequence
     *
     * @param {*} item the item to locate
     * @returns {number} 0-based position in the seqeunce, or -1 if it was not found
     */
    indexOf(item: any): number;
    /**
     * Locate the last ordinal position (0-based) of an item in the sequence
     *
     * @param {*} item the item to locate
     * @returns {number} 0-based position of the last occurrence in the seqeunce, or -1 if it was not found
     */
    lastIndexOf(item: any): number;
    /**
     * Locate the index of an element meeting the condition specified by the callback function, which
     * should return `true` when the condition has been met
     *
     * @param {(item: any, index: number)=>boolean} callback the function to invoke for each element
     * @param {*} thisArg the "this" context to apply to the callback
     * @returns {number} 0-based position in the sequence, or -1 if the condition was not met
     */
    findIndex(callback: (item: any, index: number) => boolean, thisArg?: any): number;
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
    find(callback: (item: any, index: number) => boolean, thisArg?: any, defaultValue?: any): any;
    /**
     * Return the element at the specified 0-based position in the sequence, or `undefined`
     * if the sequence has fewer than
     *
     * @param {number} index the position of the item to return
     * @param {*} [defaultValue] a value to return if the index was out of range
     * @returns {*} the item at the specified position, or `undefined`, or `defaultValue`
     */
    get(index: number, defaultValue?: any): any;
    /**
     * Return a subset of the sequence starting at 0-based position `begin` and ending at position `end`
     *
     * @param {number} begin the starting position
     * @param {number} end the ending position
     * @returns {Iter} the subsetted sequence
     */
    slice(begin: number, end: number): Iter;
    /**
     * Reduce the sequence to a single element.
     *
     * @param {(last: any, current: any, index: number)=>any} callback a function invoked for each element, that must return the memoized payload that is passed to the next invocation
     * @param {*} initial the initial payload
     * @returns {*} the final payload
     */
    reduce(callback: (last: any, current: any, index: number) => any, initial: any): any;
    /**
     * a function invoked for each element, in reverse order, that must return the memoized payload that is passed to the next invocation
     *
     * @param {(last: any, current: any, index: number)=>any} callback
     * @param {*} initial the initial payload
     * @returns {*} the final payload
     */
    reduceRight(callback: (last: any, current: any, index: number) => any, initial: any): any;
    /**
     * Return a string formed by joining each element in the sequence with a separator
     *
     * @param {any} separator the separator, defaults to ','
     * @returns a string of the joined sequence
     */
    join(separator: any): string;
    /**
     * Given a seqeunce of [key, value] pairs, create an object with {property: value} for each pair.
     *
     * @returns {*} the object
     */
    toObject(): any;
    /**
     * Craeate an array with each element in the seqeunce.
     *
     * @returns {any[]} the array
     */
    toArray(): any[];
    /**
     * Create an instance of `Type` from the sequence.
     *
     * @param {new (element: any)=>any} Type The constructor for Type
     * @returns {*} An instance of `Type`
     */
    as(Type: new (element: any) => any): any;
    /**
     * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
     * as in Iter object for further processing.
     *
     * @returns {Iter} a new Iter object
     */
    execute(): Iter;
    /**
     * Return the minimum value in the sequence
     * TODO: Can't really use Math for this if we want to return "any"
     *
     * @param {function} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The minimum value
     */
    min(mapCallback?: (item: any, index: any) => any): any;
    /**
     * Return the maximum value in the sequence
     *
     * @param {function} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The maximum value
     */
    max(mapCallback?: (item: any, index: any) => any): any;
    /**
     * Return the sum of all elements in the sequence
     *
     * @param {any} mapCallback An optional callback invoked on each element that returns the value to sum
     * @returns {any} The sum of all elements in the sequence (using the + operator)
     */
    sum(mapCallback?: (item: any, index: any) => any): any;
    /**
     * Sort the sequence using default comparison operator. If a `callback` is provided, then
     * it will use the return value to determine priority when comparing two elements `a` and `b`:
     * -1 means a<b, 1 means b<a
     *
     * @param {(a: any, b: any)=>number} callback the comparison callback
     * @returns {Iter} the sorted sequence
     */
    sort(callback?: (a: any, b: any) => number): Iter;
    /**
     * Reverse the order of elements in the sequence
     *
     * @returns the reversed sequence
     */
    reverse(): Iter;
}
export default iter;
