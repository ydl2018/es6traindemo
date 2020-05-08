/**
 *  通常用法
 * @type {{}}
 */

const fn = function () {}
const fnProxy = new Proxy(fn, {
    apply(target,thisBindings,args){
        console.log(thisBindings);
        return  args[0]
    },
    construct(target, argArray, newTarget) {
        return {value:argArray[0]}
    }
});

// 实现数组读取负数索引

const createArray = function(...elements){
    const  handler = {
        get(target,propKey,receiver){
            let index = Number(propKey)
            if(index < 0) index = elements.length + index;
            return Reflect.get(target,index,receiver)
        }
    }
    return new Proxy(elements,handler)
}

const arr = createArray(1,2,3)
// console.log(arr[-1]);

// 实现一个数字求平方并翻转

const pipe = (value)=>{
    const funcStack = [];
     const proxy = new Proxy({},{
        get(target,propName){
            if(propName === 'get'){
                return funcStack.reduce((val,fn)=>fn(val),value)
            }
            funcStack.push(eval(propName))
            return proxy
        }
    })
    return proxy
}

const pow = n => n*n;
// |0 是将字符串转化为数字，如果是不能转化为数字，则转化为0
const revertInt = n => n.toString().split("").reverse().join("") | 0;

//console.log(pipe(10).pow.revertInt.get);

// 利用proxy实现一个通用的生成各种DOM节点的通用函数dom

// 例如 dom.a(属性={}，子节点)
const dom = new Proxy({},{
    get(target,property){
        return function (attr = {},...children) {
            const el = document.createElement(property);
            for(let [prop,value] of Object.entries(attr)){
                el.setAttribute(prop,value)
            }
            for(let child of children){
                if(typeof child === 'string'){
                    child = document.createTextNode(child)
                }
                el.appendChild(child)
            }
            return el
        }
    }
})
// const el = dom.div({},'hello i am',dom.a({href:'baidu.com'},'yangDiLin'))

// proxy实现如果不存在属性则返回自身

const proxy = new Proxy({},{
    get(target,prop,receiver){
        return receiver
    }
});

const  obj = Object.create(proxy);
// console.log(obj.a );

// 如果一个对象不可配置不可写，通过Proxy修改，会报错

const target = Object.defineProperties({},{
    foo:{
        value:'33',
        writable:false,
        configurable:false
    }
})
const proxy2 = new Proxy(target,{
    get(target,propKey){
        return '33'
    }
})
// TypeError: 'get' on proxy: property 'foo' is a read-only and non-configurable data property on the proxy target but th
// e proxy did not return its actual value (expected '33' but got '44')
// 如果与原始的访问值不一致，会提前报错
// 如果返回值一致，反而不会有问题

// console.log(target.foo,proxy2.foo);

const validator = {
    set(target,prop,value){
        if(prop === 'age'){
            if(!Number.isInteger(target[prop])){
                throw new TypeError('the age is not an integer')
            }
            if(value > 200){
                throw new RangeError('the age seems invalid')
            }
        }
        target[prop] = value
    }
};
const person = new Proxy({},validator);
// person.age = 100;
// person.age = 'app';

// proxy set 防止_开头的方法被调用

const handler2 = {
    get(target,key){
        invariant(key,'get')
        return target[key]
    },
    set(target,prop,value){
        invariant(prop,'set')
        target[prop] = value
    }
}
function invariant(key,action) {
    if(key[0] === '_'){
        throw new Error('Invalid attempt to '+action+' private '+key)
    }
}


const proxy145 = new Proxy({_a:1},handler2);
// proxy145._a // Error: Invalid attempt to get private _a

// proxy set 例子 2
// 不可以通过proxy设置不可配置的属性或者不可读的属性
const handler150 = Object.defineProperty({},'foo',{
    writable:false,
    value:150
})
const handler154 =  {
    set(target,prop,value,receiver){
        target[prop] = 0
// 注意，严格模式下set必须返回true
        return true
    }
}
const proxy159 = new Proxy(handler150,handler154)
// proxy159.foo = 2
// console.log(proxy159.foo)
// 疑惑，proxy不是已经在访问级别拦截了吗？为什么还是会出触发源对象不可配置的特质


// proxy apply

// apply 接受三个数组
const target170 = ()=> 'I am the target!';
const handler170 = {
    apply(){
        return 'I am the proxy'
    }
}
const p176 = new Proxy(target170,handler170);
// console.log(p176()); // I am the proxy

const proxy179 = new Proxy((left,right)=> left + right,{
    apply(target,ctx,args){
        return Reflect.apply(...arguments)*2
    }
})
// console.log(proxy179(1,2)); 6
// Reflect.apply 到底做了什么

//proxy has == hasProperty

