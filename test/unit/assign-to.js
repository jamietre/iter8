import  { iter, assert, invalidNumericArgs } from './helpers/test-helper'

const myMap = new Map();
myMap.set('foo', 'bar')
myMap.set('fizz', 'buzz')

describe('assignTo', ()=>{
    it('assignTo', ()=> {
        const obj = {
            foo: 'foo-orig',
            baz: 'baz-orig'
        }
        let x = iter(myMap)
            .assignTo(obj);

        assert.ok(x === obj, 'instance returned is original instance')

        assert.deepEqual(x, {
            "foo": "bar",
            "fizz": "buzz",
            "baz": "baz-orig"
        })
    })

    it('calls return correctly', ()=> {
        assert.notCallsReturn((iter)=> {
            iter(myMap).assignTo({})
        })
    })
})
