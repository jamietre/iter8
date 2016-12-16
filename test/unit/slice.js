import  { iter, assert } from './helpers/test-helper'
   
const data = [1,2,3,4,5]

describe('slice', ()=> {
    it('two args', ()=> {
        let sut = iter(data)
        assert.deepEqual(sut.slice(2,3).toArray(), [3]);
    })

    it('one arg', ()=> {
        let sut = iter(data)
        assert.deepEqual(sut.slice(3).toArray(), [4,5]);
    })

        
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).slice(2,3).toArray()
        })

        assert.notCallsReturn((iter)=> {
            iter(data).slice(3).toArray()
        })
    })
})