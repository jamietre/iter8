import  { iter, assert, iterableFrom, testReturn, testSimpleReturn } from './helpers/test-helper'

describe('skip', ()=> {
    it('works', ()=> {
        let obj = iter([1,2,3,4,5]);

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
    testReturn({method: 'skip', arg: 0, desc: 'skip(0)', take: 0 })
    testReturn({method: 'skip', arg: 0, desc: 'skip(0)', take: 1 })
    testReturn({method: 'skip', arg: 1, desc: 'skip(1)', take: 0 })
    testReturn({method: 'skip', arg: 1, desc: 'skip(1)', take: 0 })
});
