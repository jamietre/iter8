import  { iter, assert } from './helpers/test-helper'
 
const data = [1,2,3,4,5]

class NonConsuming {
    constructor(iterable) {
        this.iterable = iterable
    }
}


describe('as', ()=> {
     it('map', ()=> {
        let sut = iter([[1,'foo'], [2, 'bar']])
        let dict = sut.as(Map)
        assert.ok(dict instanceof Map);
        assert.equal(dict.size, 2)
        assert.equal(dict.get(2), 'bar')
    })
    
    it('simple', ()=> {
        let obj = iter(data);
        let set = obj.skip(2).as(Set);
        assert.ok(set instanceof Set);
        assert.equal(set.size, 3)
    })

    it('Array', ()=> {
        let obj = iter(data);
        let set = obj.skip(2).as(Array);
        assert.ok(Array.isArray(set));
        assert.deepEqual(set, [3,4,5])
    })

    it('Object', ()=> {
        let obj = iter.fromObject({
            foo: 'bar',
            fizz: 'buzz',
            baz: 'bat'
        })

        let sut = obj.filter(e=>e[0] !== 'fizz').as(Object)
        
        assert.deepEqual(sut, {
            foo: 'bar',
            baz: 'bat'    
        })

    })

    // really never should calls "return" because it either doesn't produce an iterator (passes iterable directly to the consumer)
    // or it iterates completely to Array

    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(data).as(Array)
        })

        assert.notCallsReturn((iter)=> {
            iter(data).as(Set)
        })
    })
 });