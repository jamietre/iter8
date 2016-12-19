import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,4,5]

describe('find', ()=> {
    it('basic', ()=> {
        let sut = iter(data)
        let thisArg = {};
        assert.equal(sut.find(function(e, i) {
            assert.ok(this === thisArg, 'thisArg was passed')
            assert.ok(i === e-1)
            return e === 3
        }, thisArg), 3);
    })
    it('not found', ()=> {
        let sut = iter([])
        assert.equal(sut.find((e)=>e === 3), undefined);
    })
    
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).find(e=>e===3)
        })

        assert.notCallsReturn((iter)=> {
            iter(data).find(e=>false)
        })
    })
})
