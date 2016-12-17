import { iter, assert } from './helpers/test-helper'

describe('reduce', ()=> {
    it('reduce', ()=> {
        assert.equal(iter([1,2,3]).reduce((last, cur)=> { 
            last += cur; 
            return last;
        },0),6)
    })
})