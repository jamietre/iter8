import assert from 'assert'
import iter from '../../src/index'
import "babel-polyfill";

describe('iter - conversion', ()=> {
    it('fromObject', ()=> {

        let sut = iter({
            'foo': 'bar',
            'fizz': 'buzz'
        })

        assert.deepEqual(sut.toArray(), [['foo','bar'],['fizz','buzz']])
    })

    it('fromObject - proto chain', ()=> {
        function MyObj() {
            this.foo = 'bar'
        }
        let obj = new MyObj();
        obj.fizz = 'buzz';
        let sut = iter(obj);

        assert.deepEqual(sut.toArray(), [['foo','bar'],['fizz','buzz']])
    })

    xit('fromObject - property getters', ()=> {
        
    })

    it('can use generators', ()=> {
        function* gen() {
            yield 1;
            yield 2;
            yield 3;
        }
        assert.deepEqual(iter.fromIterator(gen).toArray(), [1,2,3]);
    });
    
})