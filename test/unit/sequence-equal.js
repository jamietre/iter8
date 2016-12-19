import { assert, iter } from './helpers/test-helper'

describe('sequenceEqual', ()=> {
    it('basic', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.ok(sut.sequenceEqual([1,2,3,4,5]), 'same are equal')
        assert.ok(!sut.sequenceEqual([1,2,3,4,5,6]), 'not equal even though same n elements match')
        assert.ok(!sut.sequenceEqual([1,2,3,4]), 'not equal even though same n elements match (shorter)')
        assert.ok(!sut.sequenceEqual([1,2,3,5,4]), 'not equal even though same same length & same elements')
    })
    it('with map', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.ok(sut.sequenceEqual([2,4,6,8,10], e=>e*2), 'left map only')
        assert.ok(sut.sequenceEqual([2,4,6,8,10], null, e=>e/2), 'right map only')
        assert.ok(sut.sequenceEqual([2,4,6,8,10], e=>e*4, e=>e*2), 'both maps')
    })

    
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter([1,2,3,4,5]).sequenceEqual([1,3]);
        },'return called for unequal sequences')

        assert.callsReturn((iter)=> {
            iter([1,2,3,4,5,6]).sequenceEqual([1,2,3,4,5]);
        },'return called for unequal sequences - matching except for extra el in 11st')

        assert.notCallsReturn((iter)=> {
            iter([1,2,3,4,5]).sequenceEqual([1,2,3,4,5,6]);
        }, 'return not called when 2nd sequence longer')

        assert.callsReturn((_iter)=> {
            iter([1,2,3,4,5]).sequenceEqual(_iter([1,2,3,4,5,6]));
        }, 'return called on 2nd sequence when longer')

        assert.notCallsReturn((iter)=> {
            iter([1,2,3,4,5]).sequenceEqual([1,2,3,4,5]);
        }, 'not called on equal sequences')
    })
});
   