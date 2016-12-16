import  { iter, assert } from './helpers/test-helper'

const data =[1,2,3,4,5]

describe('indexOf', ()=> {
    it('works', ()=> {
        let sut = iter(data)
        assert.equal(sut.indexOf(3), 2);
        assert.equal(sut.indexOf(99), -1);

        sut = iter(data).skip(1);
        assert.equal(sut.indexOf(3), 1, 'IndexOf is relative to the offset of the current iterator')
    })
        
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).indexOf(3)
        })

        assert.notCallsReturn((iter)=> {
            iter(data).indexOf(99)
        })
    })
})