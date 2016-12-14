import  { iter, assert, iterableFrom, testReturn } from './helpers/test-helper'

describe('asArray', ()=> {
    it('as Array', ()=> {
        let obj = iter([1,2,3,4,5]);
        let arr = obj.skip(2).as(Array);
        assert.ok(Array.isArray(arr));
        assert.equal(arr.length, 3)
        assert.equal(arr[2], 5)
    })
});
