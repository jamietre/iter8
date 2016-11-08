import assert from 'assert'
import iter from '../../lib/index'

const sampleData =[
    { a: 'foo', b: 1 },
    { a: 'foo', b: 2 },
    { a: 'bar', b: 6 },
    { a: 'foo', b: 4 }
    ];

const data2 = [
    { value: '1', key: 1 },
    { value: '2-1', key: 2 },
    { value: '2-2', key: 2 },
    { value: '3', key: 3 },
    { value: '4', key: 4 },
    { value: '5', key: 5 }
]

const data3 = [
    { value: 'x-2', key: 2 },
    { value: 'x-3', key: 3 },
    { value: 'x-6', key: 6 }
]

const data4 = [
    { value: 'x2-1', key: 2 },
    { value: 'x2-2', key: 2 },
    { value: 'x3-1', key: 3 },
    { value: 'x3-2', key: 3 },
    { value: 'x5', key: 6 }
]

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
    describe('last', ()=> {
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
    describe('groupBy', ()=> {
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
        it('with odd keys', ()=>{
            let symbol = Symbol()
            let data = [
                [undefined,'undef1'],
                [undefined,'undef2'],
                [null,'null'],
                ['foo','foo1'],
                ['foo','foo2'],
                [symbol,'symbol1'],
                [symbol,'symbol2']
            ]
            let sut = iter(data).groupBy(e=>e[0], e=>e[1])
                .map(e=>e[1]).
                flatten()

            assert.deepEqual(sut.toArray(), 
                ['undef1','undef2',
                'null',
                'foo1', 'foo2',
                'symbol1', 'symbol2']
            )
        })
    })
    
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
        it('map - prop', ()=> {
            let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
            assert.equal(sut.sum('foo'), 15);
        })
    })

    xdescribe('mean', ()=> {
        it('basic', ()=> {
            let sut = iter([2,4,6,8,10,12]);
            assert.equal(sut.sum(), 29);
        })
        it('map', ()=> {
            let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
            assert.equal(sut.sum((e)=>e.foo), 15);
        })
        it('map - prop', ()=> {
            let sut = iter([{ foo: 1}, {foo: 4}, {foo: 10}]);
            assert.equal(sut.sum('foo'), 15);
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
    describe('unique', ()=> {
        it('unique', ()=> {
            let sut = iter([1,2,2,3,6,12,1,2,2,9]);
            assert.deepEqual(sut.unique().toArray(), [1,2,3,6,12,9])
        })
        it('unique with key', ()=> {
            let sut = iter([ 
                { key: 1, value: 'foo'},
                { key: 1, value: 'foo-2'},
                { key: 2, value: 'bar'},
                { key: 3, value: 'fizz'},
                { key: 3, value: 'buzz'},
            ])
            .unique('key')
            .map(e=>e.value);
            assert.deepEqual(sut.toArray(), ['foo', 'bar', 'fizz'])

        });
    });
        
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
            // nothing happens
            return false;
        });
        assert.deepEqual(arr, [[1,0], [2,1], [3,2], [4,3], [5,4]])
    })
    it('reduce', ()=> {
        assert.equal(iter([1,2,3]).reduce((last, cur)=> { 
            last += cur; 
            return last;
        },0),6)
    })
    it('reduceRight', ()=> {
        let done=false; 
        assert.equal(iter([1,2,3]).reduceRight((last, cur, index)=> {
            if (done===false) {
                assert.ok(index === 2)
                assert.ok(cur === 3)
                done = true;
            }
            last += cur;
            return last;
        },0),6)

        assert.ok(done === true);
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
    describe('slice', ()=> {
        it('two args', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.deepEqual(sut.slice(2,3).toArray(), [3,4]);
        })

        it('one arg', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.deepEqual(sut.slice(3).toArray(), [4,5]);
        })
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

    describe('except', ()=> {
        const expected = ['1','4','5']
        it('basic', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.deepEqual(sut.except([3,4]).toArray(), [1,2,5])
            assert.deepEqual(sut.except([1,5,6]).toArray(), [2,3,4])
        })
        it('with on', ()=> {
            let sut = iter(data2)
                .except(data3)
                .on(x=>x.key)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), expected)
        })

        it('with on - left only', ()=> {
            let sut = iter(data2)
                .except([2,3,6])
                .on(a=>a.key, null)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), expected)
        })

        it('with on - right only', ()=> {
            let sut = iter([1,2,2,3,4,5])
                .except(data3)
                .on(null, b=>b.key);

            assert.deepEqual(sut.toArray(), [1,4,5])
        })
    });
    describe('intersect', ()=> {
        let expected = ['2-1', '2-2', '3']
        it('basic', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.deepEqual(sut.intersect([4,5,8,9]).toArray(), [4,5])
            assert.deepEqual(sut.intersect([8,9,10]).toArray(), [])
        })
        it('with on - duplicates', ()=> {
            let sut = iter(data2)
                .intersect(data4)
                .on(x=>x.key)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), ['2-1','2-2', '3'])
        }) 
        it('with on', ()=> {
            let sut = iter(data2)
                .intersect(data3) 
                .on(x=>x.key)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), expected)
        })


        it('with on - left only', ()=> {
            let sut = iter(data2)
                .intersect([2,3,6])
                .on(a=>a.key, null)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), expected)
        })

        it('with on - right only', ()=> {
            let sut = iter([1,2,2,3,4,5])
                .intersect(data3)
                .on(null, b=>b.key);

            assert.deepEqual(sut.toArray(), [2,2,3])
        })
    })
    
    describe('union', ()=> {
        const expected = ['1','2-1','2-2','3','4','5','x-6']
        it('union', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.deepEqual(sut.union([4,5,6,7,8]).toArray(), [1,2,3,4,5,6,7,8]) 
        })
        it('with on - duplicates', ()=> {
        
            let sut = iter(data2)
                .union(data4)
                .on(x=>x.key)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), ['1','2-1','2-2','3','4','5','x5'], "All values from left, plus any values from right are included")
        }) 
        it('with on', ()=> {
            let sut = iter(data2)
                .union(data3) 
                .on(x=>x.key)
                .map(a=>a.value)

            assert.deepEqual(sut.toArray(), expected)
        })


        it('with on - left only', ()=> {
            let sut = iter(data2)
                .union([2,3,6])
                .on(a=>a.key, null)
                .map(a=>a.key || a)

            assert.deepEqual(sut.toArray(), [1,2,2,3,4,5,2,3,6])
        })

        it('with on - right only', ()=> {
            let sut = iter([1,2,2,3,4,5])
                .intersect(data3)
                .on(null, b=>b.key);

            assert.deepEqual(sut.toArray(), [2,2,3])
        })
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
        it('orderByDesc property', ()=> {
            let sut = iter(seq).orderByDesc('foo').map(e=>e.id);

            // note: not actually the reverse of "orderBy" because the elements with the same value 
            // are in the orignal sequence order either way
            assert.deepEqual(sut.toArray(), [4,2,7,3,5,6,1]);
        })
/*
            {foo:1, id:1},
            {foo:4, id:2},
            {foo:2, bar:2, id:3},
            {foo:5, id:4},
            {foo:2, bar: 1, id:5},
            {foo:2, bar: 3, id:6},
            {foo:3, id:7}
*/

        it('orderBy thenByDesc property', ()=> {
            let sut = iter(seq).orderBy('foo')
                .thenByDesc('bar')
                .map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,6,3,5,7,2,4]);
        })
    });
    describe('sequenceEqual', ()=> {
        it('basic', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.ok(sut.sequenceEqual([1,2,3,4,5]), 'same are equal')
            assert.ok(!sut.sequenceEqual([1,2,3,4,5,6]), 'not equal even though same n elements match')
            assert.ok(!sut.sequenceEqual([1,2,3,4]), 'not equal even though same n elements match (shorter)')
            assert.ok(!sut.sequenceEqual([1,2,3,5,4]), 'not equal even though same same length & same elements')
        })
        it('with map', ()=> {
            let sut = iter([1,2,3,4,5])
            assert.ok(sut.sequenceEqual([2,4,6,8,10], e=>e*2), 'left map only')
            assert.ok(sut.sequenceEqual([2,4,6,8,10], null, e=>e/2), 'right map only')
            assert.ok(sut.sequenceEqual([2,4,6,8,10], e=>e*4, e=>e*2), 'both maps')
        })
    });
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
        let seq1 = [
            { group: 1, value: 'bar' }, 
            { group: 1, value: 'foo', },
            { group: 2, value: 'fizz' },
            { group: 3, value: 'buzz' }
        ];
        let seq2 = [
            { group: 1, value: 'a'},
            { group: 3, value: 'b'},
            { group: 3, value: 'c'},
            { group: 4, value: 'd'},
        ]
        it('on fn', ()=> {
            let merged = iter(seq1)
                .leftJoin(seq2, (left, right={}, key)=> `${key}:${left.value},${right.value||''}`)    
                .on(left => left.group, right => right.group)

            assert.deepEqual(merged.toArray(), [
                "1:bar,a", "1:foo,a", "2:fizz,", "3:buzz,b", "3:buzz,c"])
            
        })
        it('on string', ()=> {
            let merged = iter(seq1)
                .leftJoin(seq2, (left, right={}, key)=> `${key}:${left.value},${right.value||''}`)    
                .on('group')

            assert.deepEqual(merged.toArray(), [
                "1:bar,a", "1:foo,a", "2:fizz,", "3:buzz,b", "3:buzz,c"])
            
        })
    
    })
})