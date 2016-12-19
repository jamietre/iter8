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

    it('calls return correctly', () => {
        // there will be 7 total elements in the joined sequences

        const seq1 = [1,2,3,4,5]
        const seq2 = [2,3,6,7]
        assert.callsReturn((iter) => {
            iter(seq1).union(seq2).take(2).toArray()
        },'when taking only from 1st sequence')

        assert.notCallsReturn((iter) => {
            iter(seq1).union(seq2).take(6).toArray()
        },'when taking all of 1st sequence')

        assert.callsReturn((_iter) => {
            iter(seq1).union(_iter(seq2)).take(6).toArray()
        },'calls return on 2nd sequence when taking part of 2nd sequence')

        assert.notCallsNextOrReturn((_iter) => {
            iter(seq1).union(_iter(seq2)).take(4).toArray()
        },'2nd sequence untouched when 1st seqeunce not iterated completely')

        assert.callsReturn((_iter) => {
            iter(seq1).union(_iter(seq2)).take(6).toArray()
        },'2nd partially iterated')

        assert.callsReturn((_iter) => {
            iter(seq1).union(_iter(seq2)).take(7).toArray()
        },'2nd at end boundary')

        assert.notCallsReturn((_iter) => {
            iter(seq1).union(_iter(seq2)).take(8).toArray()
        },'iterated completely')

    })
})
