import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,4,5,3,2]

describe('lastIndexOf', ()=> {
    it('works', ()=> {
        let sut = iter(data)
        assert.equal(sut.lastIndexOf(3), 5);
        assert.equal(sut.indexOf(99), -1);
    })
    
    // lastIndexOf shuld always iterate the sequence

       
    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(data).lastIndexOf(3)
        })

        assert.notCallsReturn((iter)=> {
            iter(data).lastIndexOf(99)
        })
    })

})