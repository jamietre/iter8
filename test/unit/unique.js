import  { iter, assert } from './helpers/test-helper'

const data = [1,2,2,3,6,12,1,2,2,9]

describe('unique', ()=> {
    it('unique', ()=> {
        let sut = iter(data);
        assert.equal(sut.count(), data.length)
        assert.deepEqual(sut.unique().toArray(), [1,2,3,6,12,9])
    })

    it('unique with key', ()=> {
        let sut = iter([ 
            { key: 1, value: 'foo'},
            { key: 1, value: 'foo-2'},
            { key: 2, value: 'bar'},
            { key: 3, value: 'fizz'},
            { key: 3, value: 'buzz'},
        ])
        .unique('key')
        .map(e=>e.value);
        assert.deepEqual(sut.toArray(), ['foo', 'bar', 'fizz'])
    });

    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).unique().take(3).toArray()
        })

        assert.notCallsReturn((iter)=> {
            iter(data).unique().toArray()
        })
    })
});
    