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
     
    it('calls return correctly', ()=> {

        assert.callsReturn((_iter)=> {
            _iter([1,2,[3],4,5]).flatten().take(2).toArray();
        }, 'not iterating entire sequence')

        assert.callsReturn((_iter)=> {
            _iter([1,2,[3],4,5]).flatten().take(3).toArray();
        }, 'not iterating entire sequence - at boundary of inner sequence')

        assert.notCallsReturn((_iter)=> {
            _iter([1,2,[3],4,5]).flatten().take(6).toArray();
        }, 'iterating entire sequence')

        assert.callsReturn((_iter)=> {
            let obj = _iter([5,6,7])
            iter([[1,2], obj, [10]]).flatten().take(3).toArray();
        }, 'calls return on inner object partially iterated')
        
        assert.notCallsReturn((_iter)=> {
            let obj = _iter([5,6,7])
            iter([[1,2], obj, [10]]).flatten().take(6).toArray();
        }, 'does not call return on inner object when iterated completely')
    })
});
