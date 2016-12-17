import { assert, iter } from './helpers/test-helper'

describe('reduceRight', ()=>{
    it('reduceRight', ()=> {
        let done=false; 
        let sut = iter([1,2,3]).reduceRight((last, cur, index)=> {
            if (done===false) {
                assert.ok(index === 2)
                assert.ok(cur === 3)
                done = true;
            }
            last += cur;
            return last;
        },0)
        assert.equal(sut, 6)

        assert.ok(done === true);
    })
})