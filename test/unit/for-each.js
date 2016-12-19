import  { iter, assert } from './helpers/test-helper'

describe('forEach', ()=>{
    
    it('forEach', ()=> {
        let sut = iter([1,2,3,4,5])
        let arr = []
        sut.forEach((e,i)=> {
            arr.push([e, i])
            // nothing happens
            return false;
        });
        assert.deepEqual(arr, [[1,0], [2,1], [3,2], [4,3], [5,4]])
    })
})