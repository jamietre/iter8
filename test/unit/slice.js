import  { iter, assert, iterableFrom, testReturn, testSimpleReturn } from './helpers/test-helper'
   
describe('slice', ()=> {
    it('two args', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.slice(2,3).toArray(), [3]);
    })

    it('one arg', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.slice(3).toArray(), [4,5]);
    })

    testSimpleReturn({ method: 'slice', after: 'toArray', args1: [2,3], args2: [3] })
})