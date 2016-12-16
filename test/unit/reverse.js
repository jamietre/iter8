import { assert } from './helpers/test-helper'
describe('reverse', ()=> {
    it('works', ()=> {
        let sut = iter([5,1,2,9]);
        assert.deepEqual(sut.reverse().toArray(), [9,2,1,5])
    })
})