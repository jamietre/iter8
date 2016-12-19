import assert from 'assert'
import iter from '../../'
import sinon from 'sinon'
import  { iterableFrom, Kvp, data2, data3, data4 } from './helpers/test-helper'

describe('special', ()=> {
    it('complex', ()=> {
        let items = iter([['foo', 1], ['foo',2], ['bar',3], ['bar',4], ['foo',5]])
            .cast(Kvp)
            .groupBy(e=>e.key)
            .cast(Kvp);
        
            assert.equal(items.count(), 2)
            assert.equal(items.first().key, 'foo')
            
            let fooGroup = items.first().value;

            assert.equal(fooGroup.length,3)
            assert.deepEqual(fooGroup[0], ['foo',1])
    
        let items2 = items
            .map(e=>e.value)
            .flatten();

        assert.equal(items2.count(), 5);
        
        let items3 = items2
            .map(e=>e.value)
            .toArray();

        assert.deepEqual(items3, [1,2,5,3,4]);
    })

    it('empty sequence', ()=> {
        let sut = iter();
        assert.equal(sut.count(), 0)
    })

    describe('sequence caching', ()=> {
        it('works in simple case', ()=> {
            let source = new Map([[1,2], [2,2], [3,3], [4,3], [5,3]])

            // the "values()" method returns an iterator, not an iterable. But, it also exposes [Symbol.iterator]()
            // which returns the stateful iterator, rather than generating a new one. So iter tests first for next()
            // and if so, treats the seqence as at iterator and caches it, allowing us to safely reuse it.

            let sut = iter(source.values()).unique();
            assert.equal(sut.count(), 2)
            assert.deepEqual(sut.unique().toArray(), [2,3])
        })
        it('stop mid-stream', ()=> {
            let source = [1,2,3,4,5]
            let sut = iter(source[Symbol.iterator]());

            let seq = sut.skip(1).take(2).toArray();            
            assert.deepEqual(seq, [2,3]);

            seq = sut.toArray();
            assert.deepEqual(seq, [1,2,3,4,5]);

            seq = sut.skip(2).toArray(); 
            assert.deepEqual(seq, [3,4,5]);
        })

    })
})