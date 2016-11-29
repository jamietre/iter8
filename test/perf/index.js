import now from 'performance-now'
import iter from '../../'
import _ from 'lodash'
import assert from 'assert'

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
        iter(tests).forEach(([name, cb])=> {
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

describe('performance', ()=> {
    it('iteration vs. index access', ()=> {
        let arr = iter.generate((e)=>Math.floor(Math.random()*100),100000).toArray();
        let forOf = new Function('arr','var total=0;for (var n of arr) total+=n; return total')

        function getIterator(source) {
            var i=0;
            var length = source.length;

            return {
                next: function() {
                    
                    return  {
                        done: i>=length,
                        value: source[i++]
                    }
                }
            }            
        }
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
                    return iter(arr,true).except(arr2).toArray().length
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
                    return iter(set1,true).except(set2).toArray().length
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
                    return iter(arr, true).groupBy().toArray().length
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
                    return iter(arr,true).groupBy(e=>e[0]).toArray().length
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
                iter8:()=> {
                    return iter(arr).sum()
                },
                'iter8-own-iterator':()=> {
                    return iter(arr,true).sum()
                },
                lodash:()=> {
                    return  _(arr).sum()
                }
            }            
        });
    })
})