import assert from 'assert'
import iter, { Iter } from '../../src/index'
import "babel-polyfill";

describe('iter - conversion', ()=> {
    function SuperObj() {
    }

    SuperObj.prototype.superProp = 'super-prop'
    
    Object.defineProperties(SuperObj.prototype, {
        superFoobar: {
            get: function() {
                return 'super-fubar'
            }
        }
    })

    function Obj() {
        SuperObj.call(this);
    }
    Obj.prototype = Object.create(SuperObj.prototype);
    Obj.prototype.constructor = Obj;


    Object.defineProperties(Obj.prototype, {
        foobar: {
            get: function() {
                return 'fubar'
            }
        }
    })
    describe('default constructor', ()=> {
         it('Invoke constructor', ()=> {
            let sut = iter([1,2,3])
            assert.ok(sut instanceof Iter);
            assert.ok(sut.count() === 3);
        })
        it('empty', ()=> {
            let sut = iter()
            assert.deepEqual(sut, []);
        })
        assert.throws(()=> {
            iter(false)
        });
    })

    it('fromObject', ()=> {
        let sut = iter({
            'foo': 'bar',
            'fizz': 'buzz'
        })

        assert.deepEqual(sut.toArray(), [['foo','bar'],['fizz','buzz']])
    })

    it('fromObject', ()=> {
        let sut = iter({
            'foo': 'bar',
            'fizz': 'buzz'
        });
        sut

        assert.deepEqual(sut.toArray(), [['foo','bar'],['fizz','buzz']])
    })

    it('fromObject - proto chain', ()=> {
        let obj = new Obj();
        obj.fizz = 'buzz';
        let sut = iter.fromObject(obj);
        iter.fromObject()
        assert.deepEqual(sut.toArray(), [['fizz','buzz'], ['superProp','super-prop']])
    })

    
    it('fromObject - proto chain + filter', ()=> {
        let obj = new Obj();
        obj.fizz = 'buzz';
        obj.foo = 'bar'
        let sut = iter.fromObject(obj, ((prop)=>prop!=='fizz'));

        assert.deepEqual(sut.toArray(), [['foo','bar'], ['superProp','super-prop']])
    })

    it('fromObjectOwn - proto chain', ()=> {
        let obj = new Obj();
        obj.fizz = 'buzz';
        let sut = iter.fromObjectOwn(obj);

        assert.deepEqual(sut.toArray(), [['fizz','buzz']])
    })

    // it('fromObject - property getters - own', ()=> {
        
    // })

    it('can use generators', ()=> {
        function* gen() {
            yield 1;
            yield 2;
            yield 3;
        }
        assert.deepEqual(iter.fromGenerator(gen).toArray(), [1,2,3]);
    });

    describe('generate', ()=> {
        it('object', ()=> {
            assert.deepEqual(iter.generate("foo",5)
                .concat('bar')
                .toArray(), ["foo","foo","foo","foo","foo","bar"])
        })
        it('function', ()=> {
            assert.deepEqual(iter.generate(n=> {
                return n*2
            },5).toArray(), 
            [0,2,4,6,8])
        })
    })
    
})