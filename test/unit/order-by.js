
import { iter, assert } from './helpers/test-helper'

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