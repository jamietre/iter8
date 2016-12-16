import  { iter, assert } from './helpers/test-helper'

const data = [1,2,3,4,5]

describe('first', ()=> {
    it('basic', ()=> {
        let obj = iter(data);
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

    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).first()
        })
    })
})