declare module 'iter8' {
/**
 * Creates an instance of Iter from an iterable object, an iterator, or a generator.
 *
 * @param {(source: Iterable<any> | Iterator<any> | Generator<any>)} source the source, either an iterable, an iterator, or a generator
 */
    function iter<T>(source: Iterable<T> | Iterator<T> | Generator<T>): Iter<T>;

    /// <reference path="lib.es2015.symbol.d.ts" />

    interface Symbol {
        /** Returns a string representation of an object. */
        toString(): string;

        /** Returns the primitive value of the specified object. */
        valueOf(): Object;
    }

    type Provider<T> = (item: T) => T;
    type ProviderWithIndex<T> = (item: T, index: number) => T;
    type KeyProvider<T> = Provider<T> | string;
    type KeyProvider2<T> = ProviderWithIndex<T> | string;

    type TestProvider<T> = (item: T) => boolean;
    type TestProviderWithIndex<T> =  (item: T, index: number) => boolean

    type Generator<T> = ()=>Iterator<T>

    interface IteratorResult<T> {
        done: boolean;
        value: T;
    } 

    interface Iterator<T> {
        next(value?: any): IteratorResult<T>;
        return?(value?: any): IteratorResult<T>;
        throw?(e?: any): IteratorResult<T>;
    }

    interface Iterable<T> {
        [Symbol.iterator]: ()=>Iterator<T>
    }

    type PropDescriptor = {
        type: string,
        field: boolean,
        get: () => any,
        set: (value: any) => void,
        configurable: boolean,
        enumerable: boolean,
        depth: number
    }


    namespace iter {
        /**
         * Create an Iter from an object, returning a seqeunce of [key, value] 
         * pairs obtained by enumerating the object's properties. All properties, 
         * including those on the prototype chain, will be included, except 
         * constructor"
         *
         * @param {any} obj An object
         * @param {TestProvider<string>} [filter] A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
         * @returns {IterKvp<string, any>} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
         */
        let fromObject: (obj: any, filter?: TestProvider<string>) => IterKvp<string, any>;
        /**
         * Create an Iter from an object, returning a seqeunce of [key, value] pairs obtained
         * by enumerating the object's properties. Only the object's own properties (e.g. no prototype chain)
         * are included.
         *
         * @param {any} obj An object
         * @param {TestProvider<string>} [filter] A callback that is invoked with each property name. Returing `false` will omit a property from the sequence.
         * @returns {IterKvp<string, any>} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
         */
        let fromObjectOwn: (obj: any, filter?: TestProvider<string>) => IterKvp<string, any>;
        /**
         * Generate a sequence from a `function(n)` invoked `times` times, or by repeating a single value.
         *
         * @param {(index: number) => any | any} obj An object to repeat, or a `function(n)` that returns an object.
         * @param {number} times The number of times to invoke the generator or repeat
         * @returns {IterKvp<string, any>} an Iter instance with a sequence of [key, value] pairs corresponding to the object's properties
         */
        let generate: (obj: (index: number) => any | any, times: number) => IterKvp<string, any>;
        /**
         * Get metadata about the properties, and optionally the prototype chain, of an object
         *  
         * @param {object} object The object to refelect
         * @param {boolean} [recurse] If true, recurse prototype chain
         * @param {TestProvider<string>} [filter] A callback invoked for each property name that should return true to include it, or false to exclude it
         * @returns {IterKvp<string, PropDescriptor>} An array of [key, value] pairs where the key is the prop name, and the value is the prop descriptor
         */    
        let reflect: (object: any, recurse?: boolean, filter?: TestProvider<string>) => IterKvp<string, PropDescriptor>; 
    }

    class Iter<T> implements Iterable<T> {
        /**
         * Creates an instance of Iter from an iterable object, an iterator, or a generator.
         *
         * @param {(source: Iterable<T> | Iterator<T> | Generator<T>)} source the source, either an iterable, an iterator, or a generator
         */
        constructor(source: Iterable<T> | Iterator<T> | Generator<T>);
        
        [Symbol.iterator](): Iterator<T>;
        /**
         * forEach is the same as do(), but executes the query immediately.
         *
         * @param {(item: T, index: number) => void} callback The callback(element, index)
         * @param {any} thisArg The "this" context applied to the callback
         * @returns {void}
         */
        forEach(callback: (item: T, index: number) => void, thisArg?: any): void;
        /**
        * Execute a callback for each element in the seqeunce, and return the same
        * element.
        *
        * @param {(item: T, index: number) => void} callback The callback(element, index)
        * @param {any} thisArg The "this" context applied to the callback
        * @returns {Iter<T>} a seqeunce identical to the input sequence
        */
        do(callback: (item: T, index: number) => void, thisArg?: any): Iter<T>;
        /**
         * Group each element in the sequence according to the value of a property if `group` is a string, a ajlk as jklasjklajkl
         * or the value returned by `function(item, index)` if group is a function. Returns a sequence
         * of `[key, value]` pairs where `value` is an array containing each item in the group.
         *
         * @param {KeyProvider<K>} key A property name or function that specifies a key to group by
         * @param {KeyProvider<T>} map A property name or function that specifies how to map each value to the group 
         * @returns {IterKvp<K, T[]]>} A sequence of `[key, value[]]` pairs where `value` is an array of items in the group
         */
        groupBy<K>(key: KeyProvider<K>, map: KeyProvider<T>): IterKvp<K, T[]>;
        /**
         * Sort by the value of a property, if `order` is a string, or by the value returned by a
         * `function(item, index)` if `order` is a function
         *
         * @param {KeyProvider<any>} order A property name or function identifying the sort key
         * @returns {Iter<T>} The sorted sequence
         */
        orderBy(order: KeyProvider<any>): Iter<T>;
        /**
         * Sort by the value of a property, in descending order. If `order` is a string, or 
         * by the value returned by a `function(item, index)` if `order` is a function
         *
         * @param {KeyProvider<any>} order A property name or function identifying the sort key
         * @returns {Iter<T>} The sorted sequence
         */
        orderByDesc(order: KeyProvider<any>): Iter<T>;
        /**
         * Add a secondary or n-ary sort order if there are multiple items with 
         * the same value. Can only follow an `order` or `then` clause.
         *
         * @param {KeyProvider<any>} order A property name or function identifying the sort key
         * @returns {Iter<T>} The sorted sequence
         */
        thenBy(order: KeyProvider<any>): Iter<T>;
        /**
         * Add a secondary or n-ary descending sort order if there are multiple 
         * items with the same value. Can only follow an `order` or `then` clause.
         *
         * @param {KeyProvider<any>} order A property name or function identifying the sort key
         * @returns {Iter<T>} The sorted sequence
         */
        thenByDesc(order: KeyProvider<any>): Iter<T>;
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
         * @returns {Iter<T>} A sequence of all items after the skipped ones
         */
        skip(n: number): Iter<T>;
        /**
         * Skip while the function evaluates to 'true' for the current value 
         *
         * @param {(T)=>boolean} callback The test function
         * @returns {Iter<T>} A sequence of all items after the skipped ones
         */
        skipWhile(callback: (T)=>boolean): Iter<T>;
        /**
         * Create a seqeunce of the next `n` items
         *
         * @param {number} n the number of items to take
         * @returns {Iter<T>} a sequence of the taken items
         */
        take(n: number): Iter<T>;
        /**
         * Create a sequence of of items that pass a test
         *
         * @param {(T)=>boolean} callback The test function
         * @returns {Iter<T>} a sequence of the taken items
         */
        takeWhile(callback: (T)=>boolean): Iter<T>;
        /**
         * Convert all items in the sequence to instances of `Type` by invoking
         *      `Type` as a constructor with the sequence as an argument
         *
         * @param {new (element: T)=>U} Type the Constructor to use
         * @returns {Iter<U>} The new sequence
         */
        cast<U>(Type: new (element: T) => U): Iter<U>;
        /**
         * Return the first item in the sequence, or `undefined`, or an optional
         * `defaultValue`
         *
         * @param {T} [defaultValue] a default value to return if the seqeunce has 
         *      no items.
         * @returns {T} The first item in the sequence, or `undefined` (or 
         *      `defaultValue`) if the sequence has no items.
         */
        first(defaultValue?: T): T;
        /**
         * Return the firlastst item in the sequence, or `undefined`, or an 
         * optional `defaultValue`
         *
         * @param {T} [defaultValue] a default value to return if the seqeunce has
         *      no items.
         * @returns {T} The first item in the sequence, or `undefined` (or 
         *      `defaultValue`) if the sequence has no items.
         */
        last(defaultValue?: T): T;
        /**
         * Return a new sequence created by expanding any iterable elements in the
         * original sequence into their component elements.
         *
         * @param {boolean} [recurse] when true, recurse into inner iterable
         *      elements and add their component elements to the seqeunce too
         * @returns {Iter<T>} a new sequence of all elements within inner sequences
         */
        flatten(recurse?: boolean): Iter<T>;
        /**
         * Return a sequence with only one occurrence of each distinct value in
         * the sequence
         *
         * @returns {Iter<T>} a sequence of unique values
         */
        unique(): Iter<T>;
        /**
         * Return a sequence that excludes any members also found in the other
         * sequence. Can be followed by an `on` clause to specify key.
         *
         * @param {Iterable<T>} sequence the sequence of values to exclude
         * @returns {Iter<T>} the new sequence
         */
        except(sequence: Iterable<T>): Iter<T>;
        /**
         * Return a sequence that includes only members found in the original and
         * the other `sequence`. Can be followed by an `on` clause to specify key.
         *
         *
         * @param {Iterable<T>} sequence the sequence of values to intersect
         * @returns {Iter<T>} the new sequence
         */
        intersect(sequence: Iterable<T>): Iter<T>;
        /**
         * Return a new sequence containing all values found in either sequence.
         * Can be followed by an `on` clause to specify key.
         *
         * @param {Iterable<T>} sequence the sequence of values to union
         * @returns {Iter<T>} the new sequence
         */
        union(sequence: Iterable<T>): Iter<T>;
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
         * @param {Iterable<T>} sequence the "right" sequence to join
         * @param {(left: T, right: U, key: K)=> R} [mergeCallback] the
         *     callback to create the merged value for each match
         * @returns {Iter<R>} a sequence of [key, value] pairs
         */
        leftJoin<K, U, R>(sequence: Iterable<U>, mergeCallback: (left: T, right: U, key: K) => R): Iter<R>;
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
         * @param {KeyProvider} left a function that returns a key from
         *    the original or "left" sequence
         * @param {KeyProvider} right a function that returns a key from the
         *    other or "right" sequence
         * @returns a sequence of [key, value] pairs
         */  
        on<K, U>(left: KeyProvider<K>, right: KeyProvider<K>): Iter<U>;
        /**
         * Test whether two seqeunces are equal, meaning they are the same lengths and 
         * each item at the same position in each sequence is equal.
         *
         * @param {Iterable<T>} sequence the other sequence to test
         * @param {KeyProvider<K>} left a function that returns a key from
         *    the original or "left" sequence
         * @param {KeyProvider<K>} right a function that returns a key from the
         *    other or "right" sequence
         * @returns {boolean} `true` if equal, `false` if not
         */
        sequenceEqual<K>(sequence: Iterable<T>, left: KeyProvider<K>, right: KeyProvider<K>): boolean;
        /**
         * Create a new seqeunce by concanating this sequence with all elements in all 
         * other sequences or elements passed by argument. Any iterable objects will be 
         * iterated over; not-iterable objects will be appended. Strings are always 
         * considered non-iterable.
         *
         * @param {...T[]} args the objects and/or seqeunces to append
         * @returns {Iter<T>} the resulting sequence
         */
        concat(...args: T[]): Iter<T>;
        /**
         * Return a sequence that is generated from the return values of a function invoked for
         * each element in the input sequence
         *
         * @param {KeyProvider2<U>} callback the callback(element, index)
         * @param {any} thisArg the "this" context applied to the callback
         * @returns {Iter<U>} the transformed sequence
         */
        map<U>(callback: KeyProvider2<U>, thisArg?: any): Iter<U>;
        /**
         * Return a sequence that contains only elements for which the `callback(item, index)` function
         * when invoked on each element, returns `true`.
         *
         * @param {TestProviderWithIndex<T>} callback the filter callback
         * @param {*} [thisArg] the "this" context applied to the callback
         * @returns {Iter} the filtered seqeunce
         */
        filter(callback: TestProviderWithIndex<T>, thisArg?: any): Iter<T>;
        /**
         * Test whether any elements in the sequence meet a condition
         *
         * @param {TestProviderWithIndex<T>} callback the function to invoke on each element to test
         * @param {*} [thisArg] the "this" context applied to the callback
         * @returns {boolean} `true` if at least one element met the condition
         */
        some(callback: TestProviderWithIndex<T>, thisArg?: any): boolean;
        /**
         * Test whether all elements in the sequence meet a condition
         *
         * @param {TestProviderWithIndex<T>} callback the function to invoke on each element to test
         * @param {*} [thisArg] the "this" context applied to the callback
         * @returns {boolean} `true` if all elements met the condition
         */
        every(callback: TestProviderWithIndex<T>, thisArg?: any): boolean;
        /**
         * Test whether the specified item is found in the sequence
         *
         * @param {T} item the item to search for
         * @returns {boolean} `true` if the item is found, `false` if not
         */
        includes(item: T): boolean;
        /**
         * Locate the ordinal position (0-based) of an item in the sequence
         *
         * @param {T} item the item to locate
         * @returns {number} 0-based position in the seqeunce, or -1 if it was not found
         */
        indexOf(item: T): number;
        /**
         * Locate the last ordinal position (0-based) of an item in the sequence
         *
         * @param {T} item the item to locate
         * @returns {number} 0-based position of the last occurrence in the seqeunce, or -1 if it was not found
         */
        lastIndexOf(item: T): number;
        /**
         * Locate the index of an element meeting the condition specified by the callback function, which
         * should return `true` when the condition has been met
         *
         * @param {TestProviderWithIndex<T>} callback the function to invoke for each element
         * @param {*} thisArg the "this" context to apply to the callback
         * @returns {number} 0-based position in the sequence, or -1 if the condition was not met
         */
        findIndex(callback: TestProviderWithIndex<T>, thisArg?: any): number;
        /**
         * Locate in item in the sequence meeting the condition specified by the callback function, which
         * should return `true` when the condition has been met. If the condition is not met, return
         * `undefined`, or `defaultValue` if provided.
         *
         * @param {TestProviderWithIndex<T>} callback a function returning true if the item is found
         * @param {*} [thisArg] the "this" context to apply to the callback
         * @returns {T} the found item, or `undefined`, or `defaultValue`
         */
        find(callback: TestProviderWithIndex<T>, thisArg?: any): T;
        /**
         * Return the element at the specified 0-based position in the sequence, or `undefined`
         * if the sequence has fewer than n elements
         *
         * @param {number} index the position of the item to return
         * @param {T} [defaultValue] a value to return if the index was out of range
         * @returns {T} the item at the specified position, or `undefined`, or `defaultValue`
         */
        get(index: number, defaultValue?: T): T;
        /**
         * Return a subset of the sequence starting at 0-based position `begin` and ending at position `end`
         *
         * @param {number} begin the starting position
         * @param {number} end the ending position
         * @returns {Iter<T>} the subsetted sequence
         */
        slice(begin: number, end: number): Iter<T>;
        /**
         * Reduce the sequence to a single element.
         *
         * @param {(last: U, current: T, index: number)=>U} callback a function invoked for each element, that must
         * return the memoized payload that is passed to the next invocation
         * @param {U} initial the initial payload
         * @returns {U} the final payload
         */
        reduce<U>(callback: (last: U, current: T, index: number) => U, initial: U): U;
        /**
         * Reduce the sequence to a single element, starting from the last element 
         *
         * @param {(last: U, current: T, index: number)=>U} callback a function invoked for each element, that must
         * return the memoized payload that is passed to the next invocation 
         * @param {U} initial the initial payload
         * @returns {U} the final payload
         */
        reduceRight<U>(callback: (last: U, current: T, index: number) => U, initial: U): U;
        /**
         * Return a string formed by joining each element in the sequence with a separator
         *
         * @param {string} separator the separator, defaults to ','
         * @returns a string of the joined sequence
         */
        join(separator: string): string;
        /**
         * Given a seqeunce of [key, value] pairs, create an object with {property: value} for each pair.
         *
         * @returns {*} the object
         */
        toObject(): any;
        /**
         * Craeate an array with each element in the seqeunce.
         *
         * @returns {T[]} the array
         */
        toArray(): T[];
        /**
         * Create an instance of `Type` from the sequence.
         *
         * @param {new (element: any)=>any} Type The constructor for Type
         * @returns {U} An instance of `Type`
         */
        as<U>(Type: new (element: Iterable<T>) => U | ArrayConstructor | ObjectConstructor): U;
        /**
         * Force execution of the deferred query. Useful if you want to finalize a set of operations, but still keep the result
         * as in Iter object for further processing.
         *
         * @returns {Iter<T>} a new Iter object
         */
        execute(): Iter<T>;
        /**
         * Determine the minimum value in the sequence
         *
         * @param {KeyProvider<U>} [key] A function or property name that returns the value to sum
         * @returns {U} The minimum value
         */
        min<U>(key?: KeyProvider<U>): U;
        /**
         * Determine the maximum value in the sequence
         *
         * @param {KeyProvider<U>} [key] A function or property name that returns the value to sum
         * @returns {U} The maximum value
         */
        max<U>(key?: KeyProvider<U>): U;
        /**
         * Return the sum of all elements in the sequence
         *
         * @param {KeyProvider<number>} [key] An optional callback invoked on each element that returns the value to sum
         * @returns {number} The sum of all elements in the sequence (using the + operator)
         */
        sum(key?: KeyProvider<number>): number;
        /**
         * Return the mean (average) of all elements in the sequence
         *
         * @param {KeyProvider<number>} [key] An optional callback invoked on each element that returns the value to sum
         * @returns {number} The sum of all elements in the sequence (using the + operator)
         */
        mean(key?: KeyProvider<number>): number;
        /**
         * Sort the sequence using default comparison operator. If a `callback` is provided, then
         * it will use the return value to determine priority when comparing two elements `a` and `b`:
         * -1 means a<b, 1 means b<a
         *
         * @param {(a: T, b: T)=>number} callback the comparison callback
         * @returns {Iter<T>} the sorted sequence
         */
        sort(callback?: (a: T, b: T) => number): Iter<T>;
        /**
         * Reverse the order of elements in the sequence
         *
         * @returns {Iter<T>} the reversed sequence
         */
        reverse(): Iter<T>;
        /**
         * Assuming the seqeunce contains [key, value] pairs, return a sequence of the keys
         * 
         * @returns {Iter<K>} the keys
         */
        keys<K>(): Iter<K>;
        /**
         * Assuming the seqeunce contains [key, value] pairs, return a sequence of the values
         * 
         * @returns {Iter<V>} the values
         */
        values<V>(): Iter<V>;
    }

    class IterKvp<K,V> extends Iter<[K, V]> {
        /**
         * Assuming the seqeunce contains [key, value] pairs, return a sequence of the keys
         * 
         * @returns {Iter<K>} the keys
         */
        keys(): Iter<K>;
        /**
         * Assuming the seqeunce contains [key, value] pairs, return a sequence of the values
         * 
         * @returns {Iter<V>} the values
         */
        values(): Iter<V>;
    }

    export = iter;
}
