import  { iter, assert } from './helpers/test-helper'

// sort defers to array.sort so we don't have too much to test
describe('sort', ()=> {

    it('works', ()=> {
        let sut = iter([5,1,2,9]);

        assert.deepEqual(sut.sort().toArray(), [1,2,5,9])

        assert.deepEqual(sut.sort((a,b)=>{ 
            return b - a;
        }).toArray(), [9,5,2,1])
    })
})
