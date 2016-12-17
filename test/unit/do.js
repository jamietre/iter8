import { assert, iter } from './helpers/test-helper'

const data = [1,2,3,4,5]
function noop() {}

describe('do', ()=> {
    it('do', ()=> {
        let sut = iter(data)

        let arr = [];
        let out = sut.do((e, i)=> {
            arr.push([e,i])
            return e < 3 ? 9 : false;
        }).toArray();
        
        assert.deepEqual(out, data, 'do returns input seqeuence, ignores return value');
        assert.deepEqual(arr, [[1,0], [2,1], [3,2], [4,3], [5,4]], 'do executes method');
    })
    
    it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).do(e=>noop()).take(3).toArray()
        })

        assert.notCallsReturn((iter)=> {
            iter(data).do(e=>noop()).toArray()
        })
    })
})
