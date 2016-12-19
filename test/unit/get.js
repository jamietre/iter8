import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,4,5,6,7,8];

describe('get', ()=> {
    it('get', ()=> {
        let sut = iter(data)
        assert.equal(sut.get(3), 4);
        assert.equal(sut.get(20),undefined, "undefined is returned for index out of range")
        assert.equal(sut.get(20, null),null, "default value is returned for index out of range")
    });


    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).get(4)
        }, 'partial iteration')

        assert.callsReturn((iter)=> {
            iter(data).get(7)
        }, 'exact number of elements')

        assert.notCallsReturn((iter)=> {
            iter(data).get(8)
        }, 'passed end')
    })
})