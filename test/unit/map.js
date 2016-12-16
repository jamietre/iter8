import  { iter, assert, invalidKeyArgs } from './helpers/test-helper'

const data = [1,2,3,4,5]

describe('map', ()=> {
    it('with function arg', ()=> {
        let obj = iter(data);
        let thisArg = {};

        let sut = obj.map(function(e, i) {
            assert.ok(this===thisArg)
            assert.equal(i, e-1)
            return e*2;
        }, thisArg);

        let arr = sut.toArray();
        assert.deepEqual(arr, [2,4,6,8,10]);
    });

    it('with string arg', ()=> {
        let sut = iter([{key: 1},{key: 2}, {key: 3}]).map('key').toArray();

        assert.deepEqual(sut, [1,2,3])
    })

    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).map(e=>e*2).take(2).toArray()
        })

        assert.notCallsReturn((iter)=> {
            iter(data).map(e=>e*2).toArray()
        })
    })

    it('requires a function or string', ()=> {
        invalidKeyArgs.forEach((arg)=> {
            assert.throws(()=> {
                iter(data).map(arg)
            }, /TypeError/)
        })
    })
})
