import  { iter, assert } from './helpers/test-helper'

describe('skipWhile', ()=> {
    it('skipWhile', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8]);
        assert.deepEqual(sut.skipWhile(e=>e<4).toArray(), [4,5,6,7,8]);
        assert.deepEqual(sut.skipWhile(e=>e<4).take(2).toArray(), [4,5]);
        assert.deepEqual(sut.skipWhile(e=>e<20).toArray(), []);
        assert.deepEqual(sut.skipWhile(e=>false).toArray(), [1,2,3,4,5,6,7,8])
    });
});