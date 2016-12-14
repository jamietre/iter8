import  { iter, assert, iterableFrom, testReturn } from './helpers/test-helper'

describe('filter', ()=> {
    it('works', ()=>{
        let obj = iter([1,2,3,4,5]);
        let thisArg = {};

        let sut = obj.map(function(e,i) {
            assert.equal(i,e-1)
            assert.ok(this === thisArg)
            return e*2;
        }, thisArg).filter((e)=> {
            assert.ok(this === undefined)
            return e>4;
        })

        let arr = sut.toArray();
        assert.deepEqual(arr, [6,8,10]);
    })
    
    testReturn({method: 'filter', arg: e=>true })
})
