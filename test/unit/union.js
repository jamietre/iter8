import { assert, iter, data2, data3, data4  } from './helpers/test-helper'

describe('union', ()=> {
    const expected = ['1','2-1','2-2','3','4','5','x-6']
    it('union', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.union([4,5,6,7,8]).toArray(), [1,2,3,4,5,6,7,8]) 
    })
    it('with on - duplicates', ()=> {
    
        let sut = iter(data2)
            .union(data4)
            .on(x=>x.key)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), ['1','2-1','2-2','3','4','5','x5'], "All values from left, plus any values from right are included")
    }) 
    it('with on', ()=> {
        let sut = iter(data2)
            .union(data3) 
            .on(x=>x.key)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), expected)
    })

    it('with on - left only', ()=> {
        let sut = iter(data2)
            .union([2,3,6])
            .on(a=>a.key, null)
            .map(a=>a.key || a)

        assert.deepEqual(sut.toArray(), [1,2,2,3,4,5,2,3,6])
    })

    it('with on - right only', ()=> {
        let sut = iter([1,2,2,3,4,5])
            .intersect(data3)
            .on(null, b=>b.key);

        assert.deepEqual(sut.toArray(), [2,2,3])
    })
})
