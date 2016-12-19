import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'

const data = [1,2,3,4,5,6,7,8]

describe('take-while', ()=> {
    it('takeWhile', ()=> {
        let sut = iter(data);
        assert.deepEqual(sut.skip(2).takeWhile(e=>e<6).toArray(), [3,4,5]);
        assert.deepEqual(sut.takeWhile(e=>false).toArray(), []);
        assert.deepEqual(sut.takeWhile(e=>true).toArray(), data);
    });
    
   it('calls return correctly', ()=> {
        assert.callsReturn((iter)=> {
            iter(data).takeWhile(e=>e<5).toArray() 
        }, 'calls return when taking fewer than # of elements in sequence')
        
        assert.callsReturn((iter)=> {
            iter(data).takeWhile(e=>e<8).toArray()
        }, 'calls return when taking exactly same # of elements as array')

        assert.notCallsReturn((iter)=> {
            iter(data).takeWhile(e=>e<99).toArray()
        }, 'does not call return when taking past end')
    })

})