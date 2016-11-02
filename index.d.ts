
export declare class Iter implements Iterable<any> {
    constructor(source: Iterable<any> | any);
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
    groupBy(group: (item: any, index: number) => any | string): Iter;
    orderBy(order: (item: any, index: number) => any | string): Iter;
    orderDesc(order: (item: any, index: number) => any | string): Iter;
    thenBy(order: (item: any, index: number) => any | string): Iter;
    thenDesc(order: (item: any, index: number) => any | string, desc: any): Iter;
    count(): number;
    skip(n: number): Iter;
    take(n: number): Iter;
    cast(Type: new (element: any) => any): Iter;
    first(defaultValue?: any): any;
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

declare function iter(source: any): Iter;

declare namespace iter {
    let fromIterator: (iterator: any) => Iter;
    let fromObject: (obj: any, filter?: (prop: string)=>boolean) => Iter;
    let fromObjectOwn: (obj: any, filter?: (prop: string, index: number) => boolean) => Iter;
    let repeat: (obj: any, times: number) => Iter;
}


export default iter;
