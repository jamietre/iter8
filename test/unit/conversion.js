import assert from 'assert'
import iter from '../../src/index'
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
            assert.ok(sut instanceof iter);
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

    describe('reflect', ()=> {
        class L1 {
            constructor() {
                this.name="l1"
            }
            foo() {}
            get bar() { }
            set bar(val) {}
            get baz() {}
        }
        class L2 extends L1 {
            constructor() {
                super()
                this.foo = ""
                this.fizz = 2;
                this.buzz = false;
                this.fizzbuzz = null;
                this.frobozz = undefined;
            }
            get baz() {}
        }

        // class L3 extends L2 {
        //     constructor() {
        //         super()
        //         this.frobozz = false; 
        //     }
        //     bar() {}
        // } 
        
        function mapOutput([key, value]) {
            return [key, Object.assign({}, value,{
                getter: (typeof value.getter === 'function') ? true : false,
                setter: (typeof value.setter === 'function') ? true : false,
            })]
        }
        it('pojo', ()=> {
            let sut = iter.reflect({
                foo: 'foo', 
                bar: ()=> {}
            })

            assert.deepEqual(sut.map(mapOutput).toArray(), [
                ['foo', {
                    type: 'string',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true, 
                    depth: 0
                }],
                ['bar', {
                    type: 'function',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true, 
                    depth: 0
                }]
            ])
        })

        it('proto chain 1', ()=> {
            let sut = iter.reflect(new L1(),true).orderBy('0')
            
            assert.deepEqual(sut.map(mapOutput).toArray(), [
                ['bar', {
                    type: null,
                    field: false,
                    writable: true,
                    getter: true,
                    setter: true,
                    configurable: true,
                    enumerable: false, 
                    depth: 1
                }],
                
                ['baz', {
                    type: null,
                    field: false,
                    writable: false,
                    getter: true,
                    setter: false,
                    configurable: true,
                    enumerable: false, 
                    depth: 1
                }],
                ['constructor', {
                    type: 'function',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: false, 
                    depth: 1
                }],
                ['foo', {
                    type: 'function',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: false, 
                    depth: 1
                }],
                ['name', {
                    type: 'string',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true, 
                    depth: 0 
                }]
             ])   
        })


        it('proto chain 2', ()=> {
            let sut = iter.reflect(new L2(),true).orderBy(e=>e[1].depth).thenBy(e=>e[0])
           
            assert.deepEqual(sut.map(mapOutput).toArray(), [
                
                [ 'buzz',
                    { type: 'boolean',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true,
                    depth: 0 } ],
                [ 'fizz',
                    { type: 'number',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true,
                    depth: 0 } ],    
                [ 'fizzbuzz',
                    { type: 'null',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true,
                    depth: 0 } ],    
                ['foo', {
                    type: 'string',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true,  
                    depth: 0
                }],                
                        
                [ 'frobozz',
                    { type: 'undefined',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true,
                    depth: 0 } ],                                            
                 ['name', {
                    type: 'string',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: true, 
                    depth: 0
                }],
                ['baz', {
                    type: null,
                    field: false,
                    writable: false,
                    getter: true,
                    setter: false,
                    configurable: true,
                    enumerable: false, 
                    depth: 1
                }],
                ['constructor', {
                    type: 'function',
                    field: true,
                    writable: true,
                    getter: false,
                    setter: false,
                    configurable: true,
                    enumerable: false, 
                    depth: 1
                }],
                ['bar', {
                    type: null,
                    field: false,
                    writable: true,
                    getter: true,
                    setter: true,
                    configurable: true,
                    enumerable: false, 
                    depth: 2
                }],                
            ])   
        })
    })  
})