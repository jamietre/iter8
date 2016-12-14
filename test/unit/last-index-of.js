import  { iter, assert, iterableFrom, testReturn, testSimpleReturn } from './helpers/test-helper'

describe('lastIndexOf', ()=> {
    it('works', ()=> {
        let sut = iter([1,2,3,4,5,3,2])
        assert.equal(sut.lastIndexOf(3), 5);
        assert.equal(sut.indexOf(99), -1);
    })
    
    // lastIndexOf shuld always iterate the sequence

     testSimpleReturn({ method: 'lastIndexOf', args2: [3] })
})