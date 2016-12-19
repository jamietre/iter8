import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'


const data = [1,2,3,4,5,6,7,8]

describe('take', ()=> {
    it('take', ()=> {
        let sut = iter(data)
        assert.deepEqual(sut.skip(2).take(3).toArray(), [3,4,5]);
        assert.deepEqual(sut.skip(6).take(10).toArray(), [7,8]);
    })

    it('take twice', ()=> {
        let sut = iter(data)
        assert.deepEqual(sut.skip(2).take(5).take(2).toArray(), [3,4]);
    })

    it('take NaN', ()=> {
        let sut = iter(data)
        assert.deepEqual(sut.take(NaN).toArray(), data);
    })
    it('does not consume the next element', ()=> { 
        let iterator = data[Symbol.iterator]();
        let sut = iter(iterator);

        assert.equal(sut.skip(1).take(1).first(), 2)

        let remainder = []
        for (let item of iterator) {
            remainder.push(item)
        }

        assert.deepEqual(remainder, [3,4,5,6,7,8])
    })

    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).take(4).toArray() 
        }, 'calls return when taking fewer than # of elements in sequence')
        
        assert.callsReturn((iter)=> {
            iter(data).take(data.length).toArray()
        }, 'calls return when taking exactly same # of elements as array')

        assert.notCallsReturn((iter)=> {
            iter(data).take(9).toArray()
        }, 'does not call return when taking past end')
    })

    it('requires a numeric arg', ()=> {
        invalidNumericArgs.forEach((arg)=> {
            assert.throws(()=> {
                iter(data).take(arg)
            }, /TypeError/, `argument: ${String(arg)}`)
        })
    })

    it('requires at least one arg', ()=> {
        assert.throws(()=> {
            iter(data).take()
        }, /TypeError/)
    })
})