import  { iter, sinon, assert, iterableFrom, testReturn } from './helpers/test-helper'

describe('flatten', ()=> {
    it('basic', ()=> {
        let obj = iter(['foo',[1,2,3], 4, [5,['a','b']],6, [7]]);
        let sut = iter(obj).flatten().toArray()
        assert.deepEqual(sut, ['foo',1,2,3,4,5,['a','b'],6,7])
    })
    it('recurse', ()=> {
        let obj = iter(['foo',[1,2,3],['bar', ['fizz',['buzz','baz']]]]);
        let sut = iter(obj).flatten(true).toArray()
        assert.deepEqual(sut, ['foo',1,2,3,'bar','fizz','buzz','baz']);
    });

    // test that return was also called on the inner object in flatten that 
    // was partially iterated
    
    it('inner array', ()=> {
        let rt = sinon.stub()
        let obj = iterableFrom([5,6,7], rt);

        assert.deepEqual(iter([[1,2], obj, [10]]).flatten().take(3).toArray(), [1,2,5], 'works with take')

        let sut = testReturn({ method: 'flatten', data: [[1,2], obj, [10]], take: 3 })
        assert.ok(rt.calledOnce, 'return was called on inner array')

        rt = sinon.stub()
        obj = iterableFrom([5,6,7], rt);
        testReturn({ method: 'flatten', data: [[1,2], obj, [10]], take: 2 })
        assert.ok(!rt.calledOnce, 'return was not called on inner array')
    })
});
