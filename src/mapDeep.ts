import _ from 'lodash'
import { ObjCallbackFn, Key_ish, Obj_ish, Val_ish } from './patchifierTypes'

export const mapKeysDeep = (obj:any, cb:(ob:any,k:Key_ish,v:any)=>{}, parentObj?:any, key?:Key_ish, doClone = false): any => {
  const ob = doClone ? _.cloneDeep(obj) : obj
  return (_.isObject(ob))
    ? (_.isArray(ob)
      ? _.map(ob, (v, k) => mapKeysDeep(v, cb, ob, k, doClone))
      : _.fromPairs(_.map(_.toPairs(ob), 
          ([k, v]) => [cb(ob, k, v), mapKeysDeep(v, cb, ob, k, doClone)])
        )
    )
    : ob
}


export const mapValuesDeep = (obj:any, cb:ObjCallbackFn, parentObj?:any, key?:Key_ish, doClone = false):any => {
  const ob = doClone ? _.cloneDeep(obj) : obj
  const dig = (v:any, k:Key_ish) => mapValuesDeep(v, cb, ob, k, doClone)
  return _.isObject(ob)
    ? (_.isArray(ob)
      ? _.map(ob, dig)
      : _.mapValues(ob, dig)
    )
    : cb(parentObj, key, ob)
}

// === TEST ============================================================================
// Use below "chk()s" with JS REPL extension in VS Code for quick refactor checks
//     or see ./getMatch.test.ts for Jest tests

function chk(testFunc:(x:any,y:any)=>{}, obj:any, func:ObjCallbackFn, exp:any) {
  const res = testFunc(obj, func); 
  return (_.isEqual(res, exp)) ? 'PASS' : 'FAIL => '+JSON.stringify(res)
  }
const isObject = (v:any) => ( typeof v === 'object' && v !== null )

// should alter keys of object and sub-objects per output of callback() with good key and value params
const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
chk( mapKeysDeep, testObj, 
  (_obj:Obj_ish, k:Key_ish | undefined, v:Val_ish) => (k+'').toUpperCase() + (isObject(v)?'':v), 
  { A: { C2: 2 }, D: [ { X7: 7 }, { Y8: 8 } ] } 
) //=
mapKeysDeep(  testObj, (obj, k, v) => (k+'').toUpperCase() + (isObject(v)?'':v)) //=

// should keep type of values intact during mapping. Ex: 2 + 2 == 4, not "2"+2 == "22"
chk( mapKeysDeep, testObj, 
  (obj, k, v) => k + (isObject(v)?'':v+2),
  { a: { c4: 2 }, d: [ { x9: 7 }, { y10: 8 } ] } 
) //=
mapKeysDeep(  testObj, (obj, k, v) => k + (isObject(v)?'':v+2))                //=

// should get callback() with good key and value parameters
chk( mapValuesDeep, testObj,
  (obj, k, v) => '' + (k+'').toUpperCase()+'=='+(v),
  { a: { c: 'C==2' }, d: [ { x: 'X==7' }, { y: 'Y==8' } ] }
) //=
mapValuesDeep(testObj, (obj, k, v) => '' + (k+'').toUpperCase()+'=='+(v))           //=

// should get callback() with good parentObj, key, and value parameters
chk( mapValuesDeep, testObj,
  (obj, k, v) => `${JSON.stringify(obj)}.${k} == ${v}`,
  { a: { c: '{"c":2}.c == 2' }, d: [ { x: '{"x":7}.x == 7' }, { y: '{"y":8}.y == 8' } ] }
) //=
mapValuesDeep(testObj, (obj, k, v) => `${JSON.stringify(obj)}.${k} == ${v}`)   //=

chk( mapValuesDeep, testObj,
  (obj, k, v) => v,
  { a: { c: 2 }, d: [ { x: 7 }, { y: 8 } ] }
) //= 
mapValuesDeep(testObj, (obj:Obj_ish, k?:Key_ish, v?:Val_ish) => v)//=