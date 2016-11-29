// import assert from 'assert'
// import iter from '../../lib/index'
// const Kvp = iter.Kvp

// const data = {
//     bar: 2,
//     foo: 1,
//     biz: 3,
//     cru: 4,
//     baz: 4,
//     bazz: 4,
//     fuzz: 5
// }

// describe('kvp', ()=> {
//     it('from array', ()=> {
//         let kvp = new Kvp([1,2]);
//         assert.equal(kvp.key, 1)
//         assert.equal(kvp.value, 2)
//         assert.equal(kvp[0], 1)
//         assert.equal(kvp[1], 2)
//     })
//     it('from args', ()=> {
//         let kvp = new Kvp(1,2);
//         assert.equal(kvp.key, 1)
//         assert.equal(kvp.value, 2)
//         assert.equal(kvp[0], 1)
//         assert.equal(kvp[1], 2)
//     })

//     it("casting", ()=> {
//         let seq = iter.fromObject(data)
//             .cast(Kvp)
//             .orderBy('value')
//             .thenBy('key');
            
//         assert.deepEqual(
//             seq.map(e=>e.key).toArray(), 
//             ['foo','bar','biz','baz','bazz','cru','fuzz']
//         )
//         assert.ok(seq.first() instanceof Kvp)
//     });
// })

