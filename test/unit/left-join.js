import  { iter, assert } from './helpers/test-helper'

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
