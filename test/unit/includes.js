import { iter, assert } from './helpers/test-helper'

const data = [1, 2, 3, 5, 10]

describe('includes', () => {
    it('works', () => {
        let sut = iter(data)
        assert.ok(sut.includes(3));
        assert.ok(!sut.includes(4));
    });

    it('calls return correctly', () => {
        assert.callsReturn((iter) => {
            iter(data).includes(3)
        })

        assert.notCallsReturn((iter) => {
            iter(data).includes(99)
        })
    })
})