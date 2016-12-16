import  { iter, assert } from './helpers/test-helper'

const data =[1,5,3,20]
describe('max', ()=> {
    it('basic', ()=> {
        let sut = iter(data);
        assert.equal(sut.max(), 20);
    })
    it('map', ()=> {
        let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
        assert.equal(sut.max((e)=>e.foo), 10);
    })

    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(data).max()
        })
    })

    it('requires a function or string', ()=> {
        
        assert.throws(()=> {
            iter(data).map(null)
        }, /TypeError/)

        assert.throws(()=> {
            iter(data).map(undefined)
        }, /TypeError/)

        assert.throws(()=> {
            iter(data).map({})
        }, /TypeError/)
    })
})
