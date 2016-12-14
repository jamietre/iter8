import  { iter, assert, iterableFrom, testReturn, testSimpleReturn } from './helpers/test-helper'

describe('findIndex', ()=> {

    it('works', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.equal(sut.findIndex((e)=>e === 3), 2);
        assert.equal(sut.findIndex((e)=>e === 99), -1);
    })
    
    testSimpleReturn({ method: 'findIndex', args1: [(e)=>e===3], args2: [(e)=>e===99] })
})