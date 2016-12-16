import  { iter, assert, Kvp } from './helpers/test-helper'

function testSimpleData(sut) {
    assert.equal(sut.length, 2)

    let el1 = sut[0];
    assert.equal(el1.key, 'foo');
    assert.deepEqual(el1.value.map(e=>e.b), [ 1,2,4 ]);

    let el2 = sut[1];
    assert.equal(el2.key, 'bar');
    assert.deepEqual(el2.value.map(e=>e.b), [ 6 ]);
}

describe('groupBy', ()=> {
    const sampleData = [
        { a: 'foo', b: 1 },
        { a: 'foo', b: 2 },
        { a: 'bar', b: 6 },
        { a: 'foo', b: 4 }
    ];

    it('groupBy string', ()=> {
        let x = iter(sampleData);

        let sut = x.groupBy('a')
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