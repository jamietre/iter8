import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'

const data = [1,2,3,4,5]

describe('skip', ()=> {
    it('works', ()=> {
        let obj = iter(data);

        let sut1 = obj.skip(2);
        assert.equal(sut1.count(),3)

        let sut2 = obj.skip(1);
        assert.equal(sut2.count(),4)
    })
    
    it('skip 0', ()=> {
        let obj = iter([1,2,3])
        assert.deepEqual(obj.skip(0).toArray(), [1,2,3])
    })
    
    it('skip 0 take 0', ()=> {
        let obj = iter([1,2,3])
        assert.deepEqual(obj.skip(0).take(0).toArray(), [])
    })

            
    it('calls return correctly', ()=> {
        assert.notCallsNextCallsReturn((iter)=> {
            iter(data).skip(0).take(0).toArray()
        }, 'skip 0, take 0')

        assert.callsReturn((iter)=> {
            iter(data).skip(0).take(1).toArray()
        }, 'skip 0, take 1')

        assert.notCallsNextCallsReturn((iter)=> {
            iter(data).skip(1).take(0).toArray()
        }, 'skip 1, take 0 -- nothing should happen')

        assert.callsReturn((iter)=> {
            iter(data).skip(1).take(1).toArray()
        }, 'skip 1, take 1')

        assert.notCallsReturn((iter)=> {
            iter(data).skip(2).toArray()
        }, 'skip 1, iterate completely')
    })

    it('requires a numeric arg', ()=> {
        invalidNumericArgs.forEach((arg)=> {
            assert.throws(()=> {
                iter(data).skip(arg)
            }, /TypeError/, `argument: ${String(arg)}`)
        })
    })
});
