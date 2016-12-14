import sinon from 'sinon'
import iter from '../../../'
import assert from 'assert'

/**
 * Wrap an iterable with another, using a user-provided return function
 */
function iterableFrom(obj, returnFn) {
    return {
        [Symbol.iterator]() {
            let iterable = obj[Symbol.iterator]()
            
            return {
                next: function() { return iterable.next() },
                return: returnFn
            }
        }
    }
}
 

/**
 * Test that a sequence-producing method invokes "return" on the original iterator if the
 * sequence isn't iterated completely, and does *not* invoke "return" if it is.
 * 
 * This happens by using "take(n)" to take some # of items < than the length of the sequence.
 * 
 * @param {any} {method, desc, arg, data=[1,2,3,4,5], take=2 }
 */
function testReturn({method, desc, arg, data=[1,2,3,4,5], take=2 }) {
    let text = `"${method}"`;
    if (desc) text += ' - ' + desc;
    text += ` - take(${take})`
    

    it(`${text} calls return on source when iterator unfinished`, ()=> {
        let rt = sinon.stub()
        let obj = iterableFrom(data, rt);

        let sut = iter(obj)[method](arg).take(take).toArray();

        assert.ok(rt.calledOnce, 'return function was called')
    })
    it(`${method} doesn't call return on source when iterator finished`, ()=> {
        let rt = sinon.stub()
        let obj = iterableFrom(data, rt);

        iter(obj)[method](arg).toArray();
        assert.ok(!rt.called, 'return function was not called')
    })
}


/**
 * Test that a method doesn't invoke return when passed [args1] and does invoke return
 * when passed [args2]. Either can be omitted if there's a case that doesn't exist.
 * 
 * @param {any} { method, data=[1,2,3,4,5], args1, args2, after }
 */
function testSimpleReturn({ 
        method, 
        data=[1,2,3,4,5], 
        args1, 
        args2, 
        desc1="calls return when sequence not iterated completely",
        desc2="does not call return when sequence iterated completely",
        after 
    }) { 
    if (args1 !== undefined) {
        it(`"${method}" ${desc1}`, ()=> {
            let rt = sinon.stub()
            let obj = iterableFrom(data, rt);
            let sut = iter(obj)
            sut = sut[method].apply(sut, args1);
            if (after) sut[after]()
            
            assert.ok(rt.called)
        });
    }
    if (args2 !== undefined) {
        it(`"${method}" ${desc2}`, ()=> {
            let rt = sinon.stub()
            let obj = iterableFrom(data, rt);
            let sut = iter(obj)
            sut = sut[method].apply(sut, args2);
            if (after) sut[after]()
            assert.ok(!rt.called)
        });
    }
}


class Kvp {
    constructor([key,value]) {
        this[0]=key;
        this[1]=value;
        Object.freeze(this)
    }
    get key() {
        return this[0]
    }
    get value() {
        return this [1]
    }
}


export { assert, iter, sinon, iterableFrom, testReturn, testSimpleReturn, Kvp }