import  { iter, assert, invalidKeyArgs } from './helpers/test-helper'

const data = [2,5,3,20]

describe('min', ()=> {
    it('basic', ()=> {
        let sut = iter(data);
        assert.equal(sut.min(), 2);
    })
    it('map', ()=> {
        let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
        assert.equal(sut.min((e)=>e.foo), 1);
    })
    
    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(data).min()
        })
    })

    it('requires a function or string arg', ()=> {
        invalidKeyArgs.forEach((arg)=> {
            assert.throws(()=> {
                iter(data).mean(arg)
            }, /TypeError/, `argument: ${String(arg)}`)
        })
    })
})