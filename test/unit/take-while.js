import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'

describe('take-while', ()=> {
    it('takeWhile', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8]);
        assert.deepEqual(sut.skip(2).takeWhile(e=>e<6).toArray(), [3,4,5]);
        assert.deepEqual(sut.takeWhile(e=>false).toArray(), []);
        assert.deepEqual(sut.takeWhile(e=>true).toArray(), [1,2,3,4,5,6,7,8]);
    });

})