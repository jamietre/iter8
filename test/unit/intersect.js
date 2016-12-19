import { assert, iter, data2, data3, data4 } from './helpers/test-helper'

describe('intersect', ()=> {
    let expected = ['2-1', '2-2', '3']
    it('basic', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.intersect([4,5,8,9]).toArray(), [4,5])
        assert.deepEqual(sut.intersect([8,9,10]).toArray(), [])
    })
    it('with on - duplicates', ()=> {
        let sut = iter(data2)
            .intersect(data4)
            .on(x=>x.key)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), ['2-1','2-2', '3'])
    }) 
    it('with on', ()=> {
        let sut = iter(data2)
            .intersect(data3) 
            .on(x=>x.key)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), expected)
    })


    it('with on - left only', ()=> {
        let sut = iter(data2)
            .intersect([2,3,6])
            .on(a=>a.key, null)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), expected)
    })

    it('with on - right only', ()=> {
        let sut = iter([1,2,2,3,4,5])
            .intersect(data3)
            .on(null, b=>b.key);

        assert.deepEqual(sut.toArray(), [2,2,3])
    })

    it('calls return correctly', () => {
        assert.callsReturn((iter) => {
            iter([1,2,3,4,5]).intersect([2,3,6]).take(2).toArray()
        })

        assert.notCallsReturn((iter) => {
            iter([1,2,3,4,5]).intersect([2,3,6]).take(6).toArray()
        })
    })
})
