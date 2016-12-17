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
});
   