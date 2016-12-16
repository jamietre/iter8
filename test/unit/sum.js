import  { iter, assert, iterableFrom } from './helpers/test-helper'

describe('sum', ()=> {
    it('basic', ()=> {
        let sut = iter([1,5,3,20]);
        assert.equal(sut.sum(), 29);
    })
    it('map', ()=> {
        let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
        assert.equal(sut.sum((e)=>e.foo), 15);
    })
    it('map - prop', ()=> {
        iter()
        let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
        assert.equal(sut.sum('foo'), 15);
    })
})
