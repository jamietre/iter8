import sinon from 'sinon'
import iter from '../../../'
import _assert from 'assert'


/**
 * Wrap an iterable with another, using a user-provided return function
 */
function iterableFrom(obj, returnFn, nextFn) {
    return {
        [Symbol.iterator]() {
            let iterable = obj[Symbol.iterator]()
            
            return {
                next: function() {
                    nextFn();
                    return iterable.next() 
                },
                return: returnFn
            }
        }
    }
}
 
/**
 * Ensure that "return" is called on the source object
 * 
 * @param {(iter: Iter)=> iter} cb A callback that uses the iter object
 */
function callsReturnHelper(cb, shouldCall, shouldCallNext, message) {
    const rt = sinon.stub()
    const nx = sinon.stub()
    cb((data)=> {
        const obj = iterableFrom(data, rt, nx);
        return iter(obj)
    });
    
    assert.ok(shouldCallNext ? nx.called : !nx.called, 
        `next() was ${shouldCallNext ? '' : ' not '} called at least once - you probably didn't use the special "iter" argument in the callback for the test`)

    assert.ok(shouldCall ? rt.calledOnce : !rt.called, message);
}

/**
 * Ensure that "return" is called on the source object
 * 
 * @param {(iter: Iter)=> iter} cb A callback that uses the iter object
 */
function callsReturn(cb, message=`"return" method was called`) {
    return callsReturnHelper(cb, true, true, message);
}

/**
 * Ensure that "return" is NOT called on the source object
 * 
 * @param {(iter: Iter)=> iter} cb A callback that uses the iter object
 */
function notCallsReturn(cb, message=`"return" method was not called`) {
    return callsReturnHelper(cb, false, true, message);
}

function notCallsNextCallsReturn(cb, message=`"return" method was called`) {
    return callsReturnHelper(cb, true, false, message);
}

function notCallsNextOrReturn(cb, message=`"return" method was called`) {
    return callsReturnHelper(cb, true, false, message);
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

const assert = Object.assign({}, _assert, {
    callsReturn,
    notCallsReturn,
    notCallsNextCallsReturn,
    notCallsNextOrReturn
})

Object.freeze(assert)

const invalidKeyArgs = [null, undefined, {}, 1, 0, Infinity, Symbol()]
const invalidNumericArgs = [null, undefined, {}, Symbol(), 'foo']


const data2 = [
    { value: '1', key: 1 },
    { value: '2-1', key: 2 },
    { value: '2-2', key: 2 },
    { value: '3', key: 3 },
    { value: '4', key: 4 },
    { value: '5', key: 5 }
]

const data3 = [
    { value: 'x-2', key: 2 },
    { value: 'x-3', key: 3 },
    { value: 'x-6', key: 6 }
]

const data4 = [
    { value: 'x2-1', key: 2 },
    { value: 'x2-2', key: 2 },
    { value: 'x3-1', key: 3 },
    { value: 'x3-2', key: 3 },
    { value: 'x5', key: 6 }
]


export { assert, iter, sinon, iterableFrom, Kvp, invalidKeyArgs, invalidNumericArgs, data2, data3, data4 }