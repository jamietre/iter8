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
     * Create an Iter from an object, returning a seqeunce of [key, value] pairs obtained
     * by enumerating the object's properties. All properties, including those on the prototype
     * chain, will be included, except "constructor"
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
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */
    orderDesc(order: (item: any, index: number) => any | string): Iter;
    /**
     * Add a secondary or n-ary sort order if there are multiple items with the same value. Can only follow an `order` or `then` clause.
     *
     * @param {((item: any, index: number)=>any | string)} order A property name or function
     * @returns {Iter} The sorted sequence
     */
    thenBy(order: (item: any, index: number) => any | string): Iter;
    /**
     * Add a secondary or n-ary descending sort order if there are multiple items with the same value. Can only follow an `order` or `then` clause.
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
     * Skip `n` items in the seqeunce, and return a new sequence of all successive items.
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
     * Convert all items in the sequence to instances of `Type` by invoking `Type` as a constructor with the sequence as an argument
     *
     * @param {new (element: any)=>any} Type the Constructor to use
     * @returns {Iter} The new sequence
     */
    cast(Type: new (element: any) => any): Iter;
    /**
     * Return the first item in the sequence, or `undefined`, or an optional `defaultValue`
     *
     * @param {*} [defaultValue] a default value to return if the seqeunce has no items.
     * @returns {*} The first item in the sequence, or `undefined` (or `defaultValue`) if the sequence has no items.
     */
    first(defaultValue?: any): any;
    /**
     * Return the firlastst item in the sequence, or `undefined`, or an optional `defaultValue`
     *
     * @param {*} [defaultValue] a default value to return if the seqeunce has no items.
     * @returns {*} The first item in the sequence, or `undefined` (or `defaultValue`) if the sequence has no items.
     */
    last(defaultValue?: any): any;
    flatten(recurse?: boolean): Iter;
    unique(): Iter;
    except(sequence: Iterable<any>): Iter;
    intersect(sequence: Iterable<any>): Iter;
    union(sequence: Iterable<any>): Iter;
    leftJoin(sequence: Iterable<any>, mergeCallback: (left: any, right: any, key: any) => any): Iter;
    joinOn(mapLeft: (item: any) => any, mapRight: (item: any) => any): Iter;
    sequenceEqual(sequence: Iterable<any>): boolean;
    concat(...args: any[]): Iter;
    /**
     * Return a single element that is the return value of a function invoked for
     * each element in the input sequence
     *
     * @param {function} callback The callback(element, index)
     * @param {any} thisArg The "this" context applied to the callback
     * @returns {Iter} A transformed sequence
     */
    map(callback: (item: any, index: number) => any, thisArg?: any): Iter;
    filter(callback: (item: any, index: number) => any, thisArg?: any): Iter;
    some(callback: (item: any, index: number) => boolean, thisArg?: any): boolean;
    every(callback: (item: any, index: number) => boolean, thisArg?: any): boolean;
    includes(item: any): boolean;
    indexOf(item: any): number;
    lastIndexOf(item: any): number;
    findIndex(callback: (item: any, index: number) => boolean, thisArg: any): number;
    find(callback: (item: any, index: number) => boolean, thisArg?: any, defaultValue?: any): any;
    get(getIndex: number, defaultValue?: any): any;
    value(): any;
    slice(begin: number, end: number): Iter;
    reduce(callback: (last: any, current: any, index: number) => any, initial: any): any;
    reduceRight(callback: (last: any, current: any, index: number) => any, initial: any): any;
    join(separator: any): string;
    toObject(): any;
    toArray(): any[];
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
    sort(callback: (a: any, b: any) => number): Iter;
    reverse(): Iter;
}
export default iter;
