import  { iter, assert, iterableFrom, testReturn } from './helpers/test-helper'

describe('map', ()=> {
    it('map works', ()=> {
        let obj = iter([1,2,3]);
        let thisArg = {};

        let sut = obj.map(function(e, i) {
            assert.ok(this===thisArg)
            assert.equal(i, e-1)
            return e*2;
        }, thisArg);

        let arr = sut.toArray();
        assert.deepEqual(arr, [2,4,6]);
    });

    testReturn({ method: 'map', arg: e=>e }) 
})
