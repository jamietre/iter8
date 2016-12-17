import { assert, iter } from './helpers/test-helper'

describe('every', ()=> {
    it('every', ()=> {
        let sut = iter([1,2,3,5,10])
        assert.ok(sut.every((e)=> e < 12 ));
        assert.ok(!sut.every((e)=> e < 10 ));
    })

})