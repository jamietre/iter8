import { assert, iter } from './helpers/test-helper'

describe('concat', ()=>{
    it('concat', ()=> {
        let sut = iter([1,2,3]).concat([4,5],6,"seven",[8,9,['a','b']]);

        assert.deepEqual(sut.toArray(), [1,2,3,4,5,6,"seven",8,9,['a','b']])

        // concat is basically the same as flatten - don't need to retest return
    })
})