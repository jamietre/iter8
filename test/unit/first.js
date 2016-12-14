import  { iter, assert, iterableFrom, testSimpleReturn } from './helpers/test-helper'

describe('first', ()=> {
    it('basic', ()=> {
        let obj = iter([1,2,3,4,5]);
        assert.equal(obj.first(), 1)
        assert.equal(obj.skip(2).first(),3)
    });
    
    it('not found', ()=> {
        let obj = iter([]);
        assert.ok(obj.first() === undefined)
    });

    it('not found - default', ()=> {
        let obj = iter([]);
        assert.ok(obj.first(null) ===null)
    });

    testSimpleReturn({ method: 'first', args1: [] })
})