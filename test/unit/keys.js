import  { iter, assert } from './helpers/test-helper'

describe('keys', ()=> {
    it('basic', ()=> {
        let sut = [['foo',1], ['bar',2]]

        assert.deepEqual(iter(sut).keys().toArray(), ['foo', 'bar'])
    })
    it('type checks', ()=> {
        let sut = [{}, ['bar',2]]

        assert.throws(()=> {
            iter(sut).keys().toArray()
        }, /not a key-value/)
    })
    
})