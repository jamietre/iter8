import assert from 'assert'
import iter from '../../'
import sinon from 'sinon'
import  { iterableFrom, Kvp} from './helpers/test-helper'

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


describe('general', ()=> {
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

    it('concat', ()=> {
        let sut = iter([1,2,3]).concat([4,5],6,"seven",[8,9,['a','b']]);

        assert.deepEqual(sut.toArray(), [1,2,3,4,5,6,"seven",8,9,['a','b']])

        // concat is basically the same as flatten - don't need to retest return
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

    it('takeWhile', ()=> {
        let sut = iter([1,2,3,4,5,6,7,8]);
        assert.deepEqual(sut.skip(2).takeWhile(e=>e<6).toArray(), [3,4,5]);
        assert.deepEqual(sut.takeWhile(e=>false).toArray(), []);
        assert.deepEqual(sut.takeWhile(e=>true).toArray(), [1,2,3,4,5,6,7,8]);
    });

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
    
        it('orderBy thenByDesc property', ()=> {
            const seq = [
            {foo:1, id:1},
            {foo:2, bar: 1, id:2},
            {foo:2, bar: 2, id:3},
            {foo:2, bar: 3, baz: 3, id:4},
            {foo:2, bar: 3, baz: 1, id:5},
            {foo:2, bar: 3, baz: 2, id:6},
            {foo:3, id:7},
            {foo:4, id:8},
            {foo:5, id:9}
            ]

            let sut = iter(seq).orderBy('foo')
                .thenByDesc('bar')
                .thenByDesc('baz')
                .map(e=>e.id);

            assert.deepEqual(sut.toArray(), [1,4,6,5,3,2,7,8,9]);
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

    describe('sequence caching', ()=> {
        it('works in simple case', ()=> {
            let source = new Map([[1,2], [2,2], [3,3], [4,3], [5,3]])

            // the "values()" method returns an iterator, not an iterable. But, it also exposes [Symbol.iterator]()
            // which returns the stateful iterator, rather than generating a new one. So iter tests first for next()
            // and if so, treats the seqence as at iterator and caches it, allowing us to safely reuse it.

            let sut = iter(source.values()).unique();
            assert.equal(sut.count(), 2)
            assert.deepEqual(sut.unique().toArray(), [2,3])
        })
        it('stop mid-stream', ()=> {
            let source = [1,2,3,4,5]
            let sut = iter(source[Symbol.iterator]());

            let seq = sut.skip(1).take(2).toArray();            
            assert.deepEqual(seq, [2,3]);

            seq = sut.toArray();
            assert.deepEqual(seq, [1,2,3,4,5]);

            seq = sut.skip(2).toArray(); 
            assert.deepEqual(seq, [3,4,5]);
        })
    })

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
})