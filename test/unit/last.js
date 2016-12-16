import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,4,5]

describe('last', ()=> {
    it('basic', ()=> {
        let obj = iter(data);
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

    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(data).last()
        })
    })
    
})
