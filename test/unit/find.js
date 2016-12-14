import  { iter, assert, iterableFrom, testReturn, testSimpleReturn } from './helpers/test-helper'
    
describe('find', ()=> {
    it('basic', ()=> {
        let sut = iter([1,2,3,4,5])
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
    it('not found -- default', ()=> {
        let sut = iter([])
        assert.equal(sut.find((e)=>e === 3, null, -2), -2);
    })
    
     testSimpleReturn({ method: 'find', args1: [e=>e === 3], args2: [e=>false] })
})
