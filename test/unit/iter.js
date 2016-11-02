import assert from 'assert'
import iter from '../../src/index'

const sampleData =[{ 
            a: 'foo',
            b: 1
        },{
            a: 'foo',
            b: 2
        },{
            a:'bar',
            b:6
        },{
            a:'foo',
            b:4
        }];

class Kvp {
    constructor([key,value]) {
        this[0]=key;
        this[1]=value;
        Object.freeze(this)
    }
    get key() {
        return this[0]
    }
    get value() {
        return this [1]
    }
}

function testSimpleData(sut) {
    assert.equal(sut.length, 2)

    let el1 = sut[0];
    assert.equal(el1.key, 'foo');
    assert.deepEqual(el1.value.map(e=>e.b), [ 1,2,4 ]);

    let el2 = sut[1];
    assert.equal(el2.key, 'bar');
    assert.deepEqual(el2.value.map(e=>e.b), [ 6 ]);
}

describe('iter', ()=> {
    describe('constructor', ()=> {
        it('Invoke constructor', ()=> {
            let sut = iter([1,2,3])
            assert.ok(sut instanceof iter);
            assert.ok(sut.count() === 3);
        })
        it('empty', ()=> {
            let sut = iter()
            assert.deepEqual(sut, []);
        })
    });
    it('map', ()=> {
        let obj = iter([1,2,3]);
        let thisArg = {};

        let sut = obj.map(function(e, i) {
            assert.ok(this===thisArg)
            assert.equal(i, e-1)
            return e*2;
        }, thisArg);

        let arr = sut.toArray();
        assert.deepEqual(arr, [2,4,6]);
    })

    it('filter', ()=> {
        let obj = iter([1,2,3,4,5]);
        let thisArg = {};

        let sut = obj.map(function(e,i) {
            assert.equal(i,e-1)
            assert.ok(this === thisArg)
            return e*2;
        }, thisArg).filter((e)=> {
            assert.ok(this === undefined)
            return e>4;
        })

        let arr = sut.toArray();
        assert.deepEqual(arr, [6,8,10]);
    })


    it('skip', ()=> {
        let obj = iter([1,2,3,4,5]);

        let sut1 = obj.skip(2);
        assert.equal(sut1.count(),3)

        let sut2 = obj.skip(1);
        assert.equal(sut2.count(),4)

    });

    describe('first', ()=> {
        it('basic', ()=> {
            let obj = iter([1,2,3,4,5]);
            assert.equal(obj.first(), 1)
            assert.equal(obj.skip(2).first(),3)
        });
        
        it('not found', ()=> {
            let obj = iter([]);
            assert.ok(obj.first() === undefined)
        });

        it('not found - default', ()=> {
            let obj = iter([]);
            assert.ok(obj.first(null) ===null)
        });
    })
    describe('first', ()=> {
        it('basic', ()=> {
            let obj = iter([1,2,3,4,5]);
            assert.equal(obj.last(), 5)
            assert.equal(obj.skip(2).last(),5)
        });
        it('not found', ()=> {
            let obj = iter([]);
            assert.ok(obj.last() === undefined)
        });
        it('not found - default`', ()=> {
            let obj = iter([]);
            assert.ok(obj.last(null) === null)
        });
    })

    describe('flatten', ()=> {
        it('basic', ()=> {
            let obj = iter(['foo',[1,2,3], 4, [5,['a','b']],6, [7]]);
            let sut = iter(obj).flatten().toArray()
            assert.deepEqual(sut, ['foo',1,2,3,4,5,['a','b'],6,7])
        })
        it('recurse', ()=> {
            let obj = iter(['foo',[1,2,3],['bar', ['fizz',['buzz','baz']]]]);
            let sut = iter(obj).flatten(true).toArray()
            assert.deepEqual(sut, ['foo',1,2,3,'bar','fizz','buzz','baz']);
        });
    });

    it('as', ()=> {
        let obj = iter([1,2,3,4,5]);
        let set = obj.skip(2).as(Set);
        assert.ok(set instanceof Set);
        assert.equal(set.size, 3)
    });
    it('as Array', ()=> {
        let obj = iter([1,2,3,4,5]);
        let arr = obj.skip(2).as(Array);
        assert.ok(Array.isArray(arr));
        assert.equal(arr.length, 3)
        assert.equal(arr[2], 5)
    })
    it('cast', ()=> {
        let obj = iter([[1,'foo'],[2,'bar']]);

        let sut = iter(obj).cast(Kvp).toArray();
        assert.equal(sut.length, 2);
        assert.ok(sut[0] instanceof Kvp)
        assert.equal(sut[0].key,1)
    })
    it('groupBy string', ()=> {
        let x = iter(sampleData);

        let sut = x.groupBy('a');
        testSimpleData(sut.cast(Kvp).toArray());
    }); 

    it('groupBy function', ()=> {
        let x = iter(sampleData);

        let sut = x.groupBy((e)=> {
            return e.a;
        });
        testSimpleData(sut.cast(Kvp).toArray());
    });

    it('complex', ()=> {
        let items = iter([['foo', 1], ['foo',2], ['bar',3], ['bar',4], ['foo',5]])
            .cast(Kvp)
            .groupBy(e=>e.key)
            .cast(Kvp);
        
            assert.equal(items.count(), 2)
            assert.equal(items.first().key, 'foo')
            
            let fooGroup = items.first().value;

            assert.equal(fooGroup.length,3)
            assert.deepEqual(fooGroup[0], ['foo',1])
    
        let items2 = items
            .map(e=>e.value)
            .flatten();

        assert.equal(items2.count(), 5);
        
        let items3 = items2
            .map(e=>e.value)
            .toArray();

        assert.deepEqual(items3, [1,2,5,3,4]);
    })

    describe('sum', ()=> {
        it('basic', ()=> {
            let sut = iter([1,5,3,20]);
            assert.equal(sut.sum(), 29);
        })
        it('map', ()=> {
            let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
            assert.equal(sut.sum((e)=>e.foo), 15);
        })
    })
    
    describe('min', ()=> {
        it('basic', ()=> {
            let sut = iter([2,5,3,20]);
            assert.equal(sut.min(), 2);
        })
        it('map', ()=> {
            let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
            assert.equal(sut.min((e)=>e.foo), 1);
        })
    })
    describe('max', ()=> {
        it('basic', ()=> {
            let sut = iter([1,5,3,20]);
            assert.equal(sut.max(), 20);
        })
        it('map', ()=> {
            let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
            assert.equal(sut.max((e)=>e.foo), 10);
        })
    })
    
    it('as', ()=> {
        let sut = iter([[1,'foo'], [2, 'bar']])
        let dict = sut.as(Map)
        assert.ok(dict instanceof Map);
        assert.equal(dict.size, 2)
        assert.equal(dict.get(2), 'bar')
    })
    it('unique', ()=> {
        let sut = iter([1,2,2,3,6,12,1,2,2,9]);
        assert.deepEqual(sut.unique().toArray(), [1,2,3,6,12,9])
    })
    it('sort', ()=> {
        let sut = iter([5,1,2,9]);
        assert.deepEqual(sut.sort().toArray(), [1,2,5,9])

        assert.deepEqual(sut.sort((a,b)=>{ 
            return b - a;
        }).toArray(), [9,5,2,1])
    })
    it('reverse', ()=> {
        let sut = iter([5,1,2,9]);
        assert.deepEqual(sut.reverse().toArray(), [9,2,1,5])
    })
    it('concat', ()=> {
        let sut = iter([1,2,3]).concat([4,5],6,"seven",[8,9,['a','b']]);

        assert.deepEqual(sut.toArray(), [1,2,3,4,5,6,"seven",8,9,['a','b']])
    })
    it('some', ()=> {
        let sut = iter([1,2,3,5,10])
        assert.ok(sut.some((e)=> e > 5 ));
        assert.ok(!sut.some((e)=> e > 10 ));
    })
    it('every', ()=> {
        let sut = iter([1,2,3,5,10])
        assert.ok(sut.every((e)=> e < 12 ));
        assert.ok(!sut.every((e)=> e < 10 ));
    })
    it('includes', ()=> {
        let sut = iter([1,2,3,5,10])
        assert.ok(sut.includes(3));
        assert.ok(!sut.includes(4));
    })
    it('do', ()=> {
        let sut = iter([1,2,3,4,5])

        let arr = [];
        let out = sut.do((e, i)=> {
            arr.push([e,i])
            return e < 3 ? 9 : false;
        }).toArray();
        
        assert.deepEqual(out, [1,2,3,4,5], 'do returns input seqeuence, ignores return value');
        assert.deepEqual(arr, [[1,0], [2,1], [3,2], [4,3], [5,4]], 'do executes method');
    })
    it('forEach', ()=> {
        let sut = iter([1,2,3,4,5])
        let arr = []
        sut.forEach((e,i)=> {
            arr.push([e, i])
        });
        assert.deepEqual(arr, [[1,0], [2,1], [3,2], [4,3], [5,4]])
    })
    it('forEach - cancel action', ()=> {
        let sut = iter([1,2,3,4,5])
        let arr = [];
        sut.forEach((e, i)=> {
            arr.push([e,i]);
            if (e === 3) { 
                return false; 
            }
        });
        assert.deepEqual(arr, [[1,0], [2,1], [3,2]])
    })
    it('reduce', ()=> {
        assert.equal(iter([1,2,3]).reduce((last, cur)=> { 
            last += cur; 
            return last;
        },0),6)
    })
    it('indexOf', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.equal(sut.indexOf(3), 2);
        assert.equal(sut.indexOf(99), -1);

        sut = iter([1,2,3,4,5]).skip(1);
        assert.equal(sut.indexOf(3), 1, 'IndexOf is relative to the offset of the current iterator')
    })
    it('lastIndexOf', ()=> {
        let sut = iter([1,2,3,4,5,3,2])
        assert.equal(sut.lastIndexOf(3), 5);
        assert.equal(sut.indexOf(99), -1);
    })
    it('slice', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.slice(2,3).toArray(), [3,4]);
    })
    it('findIndex', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.equal(sut.findIndex((e)=>e === 3), 2);
        assert.equal(sut.findIndex((e)=>e === 99), -1);
    })
    describe('find', ()=> {
        it('basic', ()=> {
            let sut = iter([1,2,3,4,5])
            let thisArg = {};
            assert.equal(sut.find(function(e, i) {
                assert.ok(this === thisArg, 'thisArg was passed')
                assert.ok(i === e-1)
                return e === 3
            }, thisArg), 3);
        })
        it('not found', ()=> {
            let sut = iter([])
            assert.equal(sut.find((e)=>e === 3), undefined);
        })
        it('not found -- default', ()=> {
            let sut = iter([])
            assert.equal(sut.find((e)=>e === 3, null, -2), -2);
        })
    })
    
    it('take', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8])
        assert.deepEqual(sut.skip(2).take(3).toArray(), [3,4,5]);
        assert.deepEqual(sut.skip(6).take(10).toArray(), [7,8]);
    })

    it('take twice', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8])
        assert.deepEqual(sut.skip(2).take(5).take(2).toArray(), [3,4]);
    })
    it('get', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8])
        assert.equal(sut.get(3), 4);
        assert.equal(sut.get(20),undefined, "undefined is returned for index out of range")
        assert.equal(sut.get(20, null),null, "default value is returned for index out of range")
    });
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
    it('except', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.except([3,4]).toArray(), [1,2,5])
        assert.deepEqual(sut.except([1,5,6]).toArray(), [2,3,4])
    })
    it('intersect', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.intersect([4,5,8,9]).toArray(), [4,5])
        assert.deepEqual(sut.intersect([8,9,10]).toArray(), [])
    })
    
    it('union', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.deepEqual(sut.union([4,5,6,7,8]).toArray(), [1,2,3,4,5,6,7,8])
    })

    describe('orderBy', ()=> {
        let seq = [
            {foo:1, id:1},
            {foo:4, id:2},
            {foo:2, bar:2, id:3},
            {foo:5, id:4},
            {foo:2, bar: 1, id:5},
            {foo:2, bar: 3, id:6},
            {foo:3, id:7}
        ]

        it('orderBy property', ()=> {
            let sut = iter(seq).orderBy('foo').map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,3,5,6,7,2,4]);
        })

        it('orderBy cb', ()=> {
            let sut = iter(seq).orderBy((e)=>e.foo).map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,3,5,6,7,2,4]);
        })

        it('thenBy property', ()=> {
            let sut = iter(seq).orderBy('foo').thenBy('bar').map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,5,3,6,7,2,4]);
        })

        it('thenBy thenBy', ()=> {
            let source = [].concat(seq);
            source.push({foo: 2, bar: 2, baz: 2, id:8})
            source.push({foo: 2, bar: 2, baz: 1, id:9})

            let sut = iter(source).orderBy('foo').thenBy('bar').thenBy('baz').map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,5,3,9,8,6,7,2,4]);
        })
        it('orderDesc property', ()=> {
            let sut = iter(seq).orderDesc('foo').map(e=>e.id);

            // note: not actually the reverse of "orderBy" because the elements with the same value 
            // are in the orignal sequence order either way
            assert.deepEqual(sut.toArray(), [4,2,7,3,5,6,1]);
        })
        it('orderBy thenDesc property', ()=> {
            let sut = iter(seq).orderBy('foo').thenDesc('bar').map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,5,3,6,7,2,4]);
        })
        it('sequenceEqual', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.ok(sut.sequenceEqual([1,2,3,4,5]), 'same are equal')
            assert.ok(!sut.sequenceEqual([1,2,3,4,5,6]), 'not equal even though same n elements match')
            assert.ok(!sut.sequenceEqual([1,2,3,4]), 'not equal even though same n elements match (shorter)')
            assert.ok(!sut.sequenceEqual([1,2,3,5,4]), 'not equal even though same same length & same elements')
        })
        describe('leftJoin', ()=> {
            let left = [[0,'foo'], [1,'bar'], [1,'baz'], [2, 'fizz']] 
            let right = [[1,'FOO'], [2,'BAR'], [2,'BARRE'], [3,'NOPE']]

            it('basic', ()=> {
                let sut = iter(left).leftJoin(right, (left, right='', key)=> {
                    return `${key}:${left}:${right}`;
                });

                // because key/value pair sequences must have unique IDs, 2,BAR gets tossed 
                assert.deepEqual(sut.toArray(), [
                    '0:foo:', '1:bar:FOO', '1:baz:FOO', '2:fizz:BARRE'
                ])
            })

            it('joinOn', ()=> {
                let sut = iter(left).leftJoin(right, (left, right, key)=> {
                    left = left[1];
                    right = right ? right[1] : '';
                    return `${key}:${left}:${right}`;
                }).joinOn((left)=>left[0], (right)=>right[0]);

                assert.deepEqual(sut.toArray(), [
                    '0:foo:', '1:bar:FOO', '1:baz:FOO', '2:fizz:BAR', '2:fizz:BARRE'
                ]) 
            })
        })
    })
})