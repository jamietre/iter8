import  { iter, assert, iterableFrom } from './helpers/test-helper'

const data = [1,2,3,4,5];

describe('filter', ()=> {
    it('works', ()=>{
        let obj = iter(data);
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
    
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).filter(e=>true).take(2).toArray()
        })

        assert.notCallsReturn((iter)=> {
            iter(data).filter(e=>true).take(6).toArray()
        })
    })
})
