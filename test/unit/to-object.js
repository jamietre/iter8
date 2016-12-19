import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'

const myMap = new Map();
myMap.set('foo', 'bar')
myMap.set('fizz', 'buzz')

describe('toObject', ()=>{
    it('toObject', ()=> {
        let x = iter(myMap)
            .toObject();
        assert.deepEqual(x, {
            foo: "bar",
            "fizz": "buzz"
        })
    })

    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(myMap).toObject()
        })
    })
})
