import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,4,5];

describe('findIndex', ()=> {

    it('works', ()=> {
        let sut = iter(data)
        assert.equal(sut.findIndex((e)=>e === 3), 2);
        assert.equal(sut.findIndex((e)=>e === 99), -1);
    })

    it('requires a function as 1st argument', ()=> {
        assert.throws(()=> {
            iter(data).findIndex(2)
        }, /TypeError/)
    })
    
        
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).findIndex(e=>e===3)
        })

        assert.notCallsReturn((iter)=> {
            iter(data).findIndex(e=>e===99)
        })
    })
})