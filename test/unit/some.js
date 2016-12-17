import  { iter, assert } from './helpers/test-helper'

describe('some', ()=> {
    it('some', ()=> {
        let sut = iter([1,2,3,5,10])
        assert.ok(sut.some((e)=> e > 5 ));
        assert.ok(!sut.some((e)=> e > 10 ));
    })
})