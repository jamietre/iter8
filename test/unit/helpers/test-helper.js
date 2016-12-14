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

function testSimpleReturn({ method, data=[1,2,3,4,5], args1, args2, after }) {
    if (args1 !== undefined) {
        it(`"${method}" calls return when sequence not iterated completely`, ()=> {
            let rt = sinon.stub()
            let obj = iterableFrom(data, rt);
            let sut = iter(obj)
            sut = sut[method].apply(sut, args1);
            if (after) sut[after]()
            assert.ok(rt.called)
        });
    }
    if (args2 !== undefined) {
        it(`"${method}" does not call return when sequence iterated completely`, ()=> {
            let rt = sinon.stub()
            let obj = iterableFrom(data, rt);
            let sut = iter(obj)
            sut = sut[method].apply(sut, args2);
            if (after) sut[after]()
            assert.ok(!rt.called)
        });
    }
}

export { assert, iter, sinon, iterableFrom, testReturn, testSimpleReturn }