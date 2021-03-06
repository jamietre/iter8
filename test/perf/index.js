import now from 'performance-now'
import iter from '../../'
import _ from 'lodash'
import assert from 'assert'
// de-optimze so we can compare methods of iterating arrays
iter._no_opt = true;

const realDescribe = describe;
describe = function(name,fn) {
    var that = this;
    return realDescribe(name, function(done) {
        this.timeout(100000);
        fn.call(that, done)
    })
}

function formatTime(ms) {
    if (ms > 1000) {
        return `${Math.floor(ms*10)/10000} seconds`;
    } else {
        return `${Math.floor(ms*1000000)/1000000} ms`;
    }
}
function runTest({name, iterations, output, tests}) {
    console.log(`\nstarting test "${name}"`)

    let data = [];
    for (var i=0;i<iterations;i++) {
        iter.fromObject(tests).forEach(([name, cb])=> {
            let start = now();
            let result = cb();

            let end = now();

            data.push({ name, result, time: end-start})
        })
    }
    console.log(`finished ${iterations} tests\n`)

    let results = iter(data).map(e=>e.result);
    let val = results.first();
    if (!results.every(e=>e === val)) {
        assert.fail(`Error - the output from all tests runs didn't match!`)
    }

    iter(data).groupBy('name')
    .orderBy(([, output])=>iter(output).mean('time'))
    .forEach(([name, output])=> {
        let r = iter(output);
        let results = r.map('result')
        console.log(`${name}: avg ${formatTime(r.mean('time'))}, min ${formatTime(r.min('time'))}, max ${formatTime(r.max('time'))}`)
    })
    console.log(`.. return value of test code: ${val}`)
    assert.ok(true, 'test finished')

}

function getIterator(source) {
    var i=0;
    var length = source.length;

    return {
        next: function() {
            
            return i < length ? {
                done: false,
                value: source[i++]
            } : { done: true };
        }
    }            
}

describe('performance', ()=> {
    it('eval functions vs normal code reuse', ()=> {
        let arr = iter.generate((e)=>Math.floor(Math.random()*100),10000000).toArray();

        let sum = new Function('x','var cur; var total=0; while (cur = x.next(), !cur.done) { total += cur.value }; return total;' )

        let sum2 = new Function('x, xform','var cur; var total=0; while (cur = x.next(), !cur.done) { total += xform(cur.value) }; return total;' )

        function valueGetter(x) {
            return x; 
        }
        runTest({
            name: "eval vs normal",
            iterations: 5,
            tests: {
                'iteration-eval':()=> {
                    return sum(arr[Symbol.iterator]());
                },
                'iteration-eval-with-function':()=> {
                    return sum2(arr[Symbol.iterator](), valueGetter);
                },
                'iteration-eval-with-function-own-iterator':()=> {
                    return sum2(getIterator(arr), valueGetter);
                },
                'iteration-eval-with-function-own-iterator-safe':()=> {
                    return sum2(getIterator(arr.slice()), valueGetter);
                },
                'normal':()=> {
                    var y = arr[Symbol.iterator]();
                    var cur; 
                    var total=0;
                    while (cur = y.next(), !cur.done) { 
                        total += cur.value 
                    }; 
                    return total;
                },
                'normal-with-function':()=> {
                    var z =arr[Symbol.iterator](); 
                    var cur; 
                    var total=0;
                    while (cur = z.next(), !cur.done) { 
                        total +=valueGetter(cur.value);
                    }; 
                    return total;
                },
                'normal-with-function-own-iterator': ()=> {
                    var z =getIterator(arr)
                    var cur; 
                    var total=0;
                    while (cur = z.next(), !cur.done) { 
                        total +=valueGetter(cur.value);
                    }; 
                    return total;
                }
            }
        })
    })

    it('iteration vs. index access', ()=> {
        let arr = iter.generate((e)=>Math.floor(Math.random()*100),100000).toArray();
        let forOf = new Function('arr','var total=0;for (var n of arr) total+=n; return total')

        runTest({
            name: "iteration vs. index access",
            iterations: 5,
            tests: {
                'iteration-for-of':()=> {
                    let total=0;
                    // babel would transpile the for/of if we coded it directly.
                    
                    return forOf(arr);
                },
                forEach:()=> {
                    let total=0;
                    arr.forEach(function(e) {
                        total+=e;
                    })
                    return total
                },
                'iteration-iter.next':()=> {
                    let iter = arr[Symbol.iterator]();
                    let cur;
                    let total=0;
                    while (cur=iter.next(), !cur.done) 
                        total+=cur.value
                    return total
                },
                'iteration-our-own-iterator':()=> {
                    let iter = getIterator(arr);
                    let cur;
                    let total=0;
                    while (cur=iter.next(), !cur.done) 
                        total+=cur.value
                    return total
                },
                'iteration-our-own-iterator-safe':()=> {
                    let iter = getIterator(arr.slice());
                    let cur;
                    let total=0;
                    while (cur=iter.next(), !cur.done) 
                        total+=cur.value
                    return total
                },
                index:()=> {
                    let total=0;
                    for (var i=0;i<arr.length;i++) {
                        total += arr[i]
                    }
                    return total
                }
            }            
        });
    })
    
    it('array push vs. direct assignment', ()=> {
        
        let arr = iter.generate((e)=>Math.floor(Math.random()*100),100000).toArray();

        runTest({
            name: "iteration vs. index access",
            iterations: 5,
            tests: {
                'push':()=> {
                    let target=[];
                    for (var i=0;i<target.count; i++) {
                        arr.push(target[i])
                    }                    
                    return target.length;
                },
                'direct-assign':()=> {
                    let target=[];
                    for (var i=0;i<target.count; i++) {
                        target[i]=arr[i]
                    }                    
                    return target.length;
                },
            }            
        });
    })

    it('except - large source', ()=> {
        let arr = iter.generate((e)=>Math.floor(Math.random()*100),1000000).toArray();
        let arr2 = iter.generate((e)=>Math.floor(Math.random()*20),100000).toArray();
        runTest({
            name: "except",
            iterations: 20,
            tests: {
                iter8:()=> {
                    return iter(arr).except(arr2).toArray().length
                },
                'iter8-own-iterator':()=> {
                    return iter(getIterator(arr)).except(arr2).toArray().length
                },
                lodash:()=> {
                    return _(arr).difference(arr2).value().length
                }
            }            
        });
    })

    it('except - from sets', ()=> {
        let set1 = iter.generate((e)=>Math.floor(Math.random()*10000000),1000000).toArray();
        let set2 = iter.generate((e)=>Math.floor(Math.random()*10000000),100000).toArray();

        runTest({
            name: "except - from set",
            iterations: 20,
            tests: {
                iter8:()=> {
                return iter(set1).except(set2).toArray().length
                },
                'iter8-own-iterator':()=> {
                    return iter(getIterator(set1)).except(set2).toArray().length
                },
                'iter8-own-iterator-safe':()=> {
                    return iter(getIterator(set1.slice())).except(set2).toArray().length
                },
                lodash:()=> {
                    return _(Array.from(set1)).difference(Array.from(set2)).value().length
                }
            }            
        });
    })


    it('groupBy - large', ()=> {
        let arr = iter.generate((e)=>Math.floor(Math.random()*100),1000000).toArray();

        runTest({
            name: "groupBy",
            iterations: 20,
            tests: {
                iter8:()=> {
                    return iter(arr).groupBy().toArray().length
                },
                'iter8-own-iterator':()=> {
                    return iter(getIterator(arr)).groupBy().toArray().length
                },
                
                lodash:()=> {
                    let obj =  _(arr).groupBy().value()
                    return Object.keys(obj).length
                }
            }            
        });
    })

    it('groupBy - with keys', ()=> {
        let arr = iter.generate((e)=>[
            Math.floor(Math.random()*100),
            Math.floor(Math.random()*20)] 
        ,1000000).toArray();

        runTest({
            name: "groupBy - with keys",
            iterations: 20,
            tests: {
                iter8:()=> {
                    return iter(arr).groupBy(e=>e[0]).toArray().length
                },
                'iter8-own-iterator':()=> {
                    return iter(getIterator(arr)).groupBy(e=>e[0]).toArray().length
                },
                lodash:()=> {
                    let obj =  _(arr).groupBy(e=>e[0]).value()
                    return Object.keys(obj).length
                }
            }            
        });
    })

    it('sum', ()=> {
        let arr = iter.generate((e)=>Math.floor(Math.random()*100), 1000000).toArray();

        runTest({
            name: "sum",
            iterations: 100,
            tests: {
                'iter8-own-iterator':()=> {
                    return iter(getIterator(arr)).sum()
                },
                'iter8-own-iterator-safe':()=> {
                    return iter(getIterator(arr.slice())).sum()
                },
                iter8:()=> {
                    return iter(arr).sum()
                },
                lodash:()=> {
                    return  _(arr).sum()
                }
            }            
        });
    })
})