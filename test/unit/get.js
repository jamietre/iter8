import  { iter, assert } from './helpers/test-helper'

describe('get', ()=> {
    it('get', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8])
        assert.equal(sut.get(3), 4);
        assert.equal(sut.get(20),undefined, "undefined is returned for index out of range")
        assert.equal(sut.get(20, null),null, "default value is returned for index out of range")
    });
})