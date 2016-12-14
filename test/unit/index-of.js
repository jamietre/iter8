import  { iter, assert, iterableFrom, testReturn, testSimpleReturn } from './helpers/test-helper'

describe('indexOf', ()=> {
    it('works', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.equal(sut.indexOf(3), 2);
        assert.equal(sut.indexOf(99), -1);

        sut = iter([1,2,3,4,5]).skip(1);
        assert.equal(sut.indexOf(3), 1, 'IndexOf is relative to the offset of the current iterator')
    })
    testSimpleReturn({ method: 'indexOf', args1: [3], args2: [99] })
})