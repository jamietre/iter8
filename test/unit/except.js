import { assert, iter, data2, data3  } from './helpers/test-helper'

const data = [1,2,3,4,5]

describe('except', ()=> {
    const expected = ['1','4','5']
    it('basic', ()=> {
        let sut = iter(data)
        assert.deepEqual(sut.except([3,4]).toArray(), [1,2,5])
        assert.deepEqual(sut.except([1,5,6]).toArray(), [2,3,4])
    })
    it('with on', ()=> {
        let sut = iter(data2)
            .except(data3)
            .on(x=>x.key)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), expected)
    })

    it('with on - left only', ()=> {
        let sut = iter(data2)
            .except([2,3,6])
            .on(a=>a.key, null)
            .map(a=>a.value)

        assert.deepEqual(sut.toArray(), expected)
    })

    it('with on - right only', ()=> {
        let sut = iter(data)
            .except(data3)
            .on(null, b=>b.key);

        assert.deepEqual(sut.toArray(), [1,4,5])
    })

    it('calls return correctly', () => {
        // result will have 2 elements
        assert.callsReturn((iter) => {
            iter(data).except([1,2,3]).take(2).toArray()
        })

        assert.notCallsReturn((iter) => {
            iter(data).except([1,2,3]).take(3).toArray()
        })
    })
});