import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'

describe('toObject', ()=>{
    it('toObject', ()=> {
        let myMap = new Map();
        myMap.set('foo', 'bar')
        myMap.set('fizz', 'buzz')
        let x = iter(myMap)
            .toObject();
        assert.deepEqual(x, {
            foo: "bar",
            "fizz": "buzz"
        })
    })
})
