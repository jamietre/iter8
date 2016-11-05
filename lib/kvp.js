'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var _p = 'prototype';
function Kvp(arr, value) {
    this[0] = value ? arr : arr[0];
    this[1] = value || arr[1];
}

['key', 'value'].forEach(function (prop, i) {
    Object.defineProperty(Kvp[_p], prop, {
        get: new Function('return this[' + i % 2 + ']')
    });
});

Object.assign(Kvp[_p], {
    toString: function toString() {
        return '[' + this.key + ',' + this.value + ']';
    },
    valueOf: function valueOf() {
        return this.key;
    }
});

exports.default = Kvp;