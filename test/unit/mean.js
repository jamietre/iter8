import  { iter, assert, invalidKeyArgs } from './helpers/test-helper'

const data = [2,4,6,8,10,12]

describe('mean', ()=> {
    it('basic', ()=> {
        let sut = iter(data);
        assert.equal(sut.mean(), 7);
    })
    it('map - fn', ()=> {
        let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
        assert.equal(sut.mean((e)=>e.foo), 5);
    })
    it('map - prop', ()=> {
        let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
        assert.equal(sut.sum('foo'), 15);
    })

    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(data).mean()
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
