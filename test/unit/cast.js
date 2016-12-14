import  { iter, assert, iterableFrom, testSimpleReturn, Kvp } from './helpers/test-helper'

describe('cast', ()=> {
    it('works', ()=> {
        let obj = iter([[1,'foo'],[2,'bar']]);

        let sut = iter(obj).cast(Kvp).toArray();
        assert.equal(sut.length, 2);
        assert.ok(sut[0] instanceof Kvp)
        assert.equal(sut[0].key,1)
    })
});
