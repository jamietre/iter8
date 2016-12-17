import  { iter, assert } from './helpers/test-helper'

describe('values', ()=> {
    it('basic', ()=> {
        let sut = [['foo',1], ['bar',2]]

        assert.deepEqual(iter(sut).values().toArray(), [1, 2])
    })
    it('type checks', ()=> {
        let sut = [{}, ['bar',2]]

        assert.throws(()=> {
            iter(sut).values().toArray()
        }, /not a key-value/)
    })
    
})