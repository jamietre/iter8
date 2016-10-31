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
    it('Invoke constructor', ()=> {
        let sut = iter([1,2,3])
        assert.ok(sut instanceof iter);
        assert.ok(sut.count() === 3);
    })
    it('map', ()=> {
        let obj = iter([1,2,3]);
        let sut = obj.map((e)=> {
            return e*2;
        });

        let arr = sut.toArray();
        assert.deepEqual(arr, [2,4,6]);
    })
    it('filter', ()=> {
        let obj = iter([1,2,3,4,5]);
        let sut = obj.map((e)=> {
            return e*2;
        }).filter((e)=> {
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

    it('first', ()=> {
        let obj = iter([1,2,3,4,5]);
        assert.equal(obj.first(), 1)
        assert.equal(obj.skip(2).first(),3)
    });
    
    
    it('last', ()=> {
        let obj = iter([1,2,3,4,5]);
        assert.equal(obj.last(), 5)
        assert.equal(obj.skip(2).last(),5)
    });

    it('flatten', ()=> {
        let obj = iter([[1,2,3], 4, [5,['a','b']],6, [7]]);
        let sut = iter(obj).flatten().toArray()
        assert.deepEqual(sut, [1,2,3,4,5,['a','b'],6,7])
    })
    
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

    it('sum', ()=> {
        let sut = iter([1,5,3,20]);
        assert.equal(sut.sum(), 29);
    })

    it('min', ()=> {
        let sut = iter([2,5,3,20]);
        assert.equal(sut.min(), 2);
    })
    it('max', ()=> {
        let sut = iter([1,5,3,20]);
        assert.equal(sut.max(), 20);
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
        let sut = iter([1,2,3]).concat([4,5],6,7,[8,9,['a','b']]);

        assert.deepEqual(sut.toArray(), [1,2,3,4,5,6,7,8,9,['a','b']])
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
    it('find', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.equal(sut.find((e)=>e === 3), 3);
        assert.equal(sut.find((e)=>e === 99), undefined);
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
        assert.equal(sut.get(20),undefined)
    });
    it('value', ()=> {
        let sut = iter([1,2,3,4,5])
        assert.equal(sut.skip(1).value(), 2);
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
        let source = [1,2,3,4,5]
        assert.deepEqual(iter(source).except([3,4]).toArray(), [1,2,5])
        assert.deepEqual(iter(source).except([1,5,6]).toArray(), [2,3,4])
    })
    it('intersect', ()=> {
        let source = [1,2,3,4,5]
        assert.deepEqual(iter(source).intersect([4,5,8,9]).toArray(), [4,5])
        assert.deepEqual(iter(source).intersect([8,9,10]).toArray(), [])
    })
    it('repeat', ()=> {
        assert.deepEqual(iter().repeat("foo",5).toArray(), ["foo","foo","foo","foo","foo"]);
    })
})