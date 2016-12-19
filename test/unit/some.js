import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,5,10]

describe('some', ()=> {
    it('some', ()=> {
        let sut = iter(data)
        assert.ok(sut.some((e)=> e > 5 ));
        assert.ok(!sut.some((e)=> e > 10 ));
    })

    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).some(e=>e===2)
        },'when found')

        assert.notCallsReturn((iter)=> {
            iter(data).some(e=>e===-1)
        },'when not found')
    })
})