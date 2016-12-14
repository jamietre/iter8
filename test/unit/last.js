import  { iter, assert, iterableFrom, testSimpleReturn } from './helpers/test-helper'

describe('last', ()=> {
    it('basic', ()=> {
        let obj = iter([1,2,3,4,5]);
        assert.equal(obj.last(), 5)
        assert.equal(obj.skip(2).last(),5)
    });

    it('not found', ()=> {
        let obj = iter([]);
        assert.ok(obj.last() === undefined)
    });
    
    it('not found - default`', ()=> {
        let obj = iter([]);
        assert.ok(obj.last(null) === null)
    });

    // last always iterates sequence completely
    
    testSimpleReturn({ method: 'last', args2: [] })
})
