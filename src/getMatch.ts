import {get as _get, find, set as _set } from 'lodash'
import _ from 'lodash'

// _.mixin({
//   deeply: function (map) {
//     return function(obj, fn) {
//       return map(_.mapValues(obj, function (v) {
//         return _.isPlainObject(v) ? _.deeply(map)(v, fn) : v;
//       }), fn);
//     }
//   },
// })

// const tst  = {a:{b:{c:42}}}
// const parO = tst.a.b
// let _k, _v
// _.deeply(_.mapKeys)(tst, (v,k)=> {
//   if(v==parO){_k=k;_v=v}
//   console.log(k,v, parO)
// } )
// console.log(_k, _v)

/**
 * 
 * Use matchPath path to get a matching deep value from an object.
 * 
 * @param obj - object to search
 * @param matchPath - lodash path, then an optional : and value or regExp to match. Examples: 'a.b' or 'a.b:42' or 'a.b:/^4/'
 * @returns matching object value, or undefined if no match
 */
export function getMatch(obj: Record<string, unknown>, matchPath: string): unknown {
  if (matchPath=='') return obj
  const [path, matchVal] = matchPath.split(":")
  const objVal    = _get(obj, path)
  if (matchVal === undefined) return objVal                         // example: getMatch({a:{b:42}},      'a.b') => 42
  const regExpStr = matchVal && matchVal.match(/^\/(.*)\/$/)?.[1]
  const regExp    = regExpStr && new RegExp(regExpStr)
  const strVal    = objVal + ''
  if (regExp) return (regExp.test(strVal))  ?  objVal  :  undefined // example: getMatch({a:{b:42}}, 'a.b:/^4/') => 42
  else        return (strVal === matchVal)  ?  objVal  :  undefined // example: getMatch({a:{b:42}}, 'a.b:42'  ) => 42
}

/**
 * 
 * Use matchPath path to get a matching deep value from an object.
 * 
 * @param obj - object to search
 * @param matchPath - lodash path, then an optional : and value or regExp to match. Examples: 'a.b' or 'a.b:42' or 'a.b:/^4/'
 * @returns matching object value, or undefined if no match
 */
export function getMatchParentKey(obj: Record<string, unknown>, matchPath: string): [match:unknown, parent:unknown, key:string] {
  if (matchPath=='') return [obj, undefined, '']
  const [path, matchVal] = matchPath.split(":")
  const match = getMatch(obj, matchPath)
  // recurse into obj to find parent and key of match
  let parent
  function digToParentObjAndKeyOfMatch(a:any, b:any): any[] {
    if (a===b) return []
    if (typeof a !== 'object') return []
    for (const [k,v] of Object.entries(a)) {
      if (v===b) return [a,k]
      const r = digToParentObjAndKeyOfMatch(v,b)
      if (r.length) return [a,k, ...r]
    }
    return []
  }

  return [match, ...((digToParentObjAndKeyOfMatch(obj, match)?.slice(-2) || [] ) as [ unknown, string ])]
}
// === TEST ============================================================================
// Use below "chk()s" with JS REPL extension in VS Code for quick refactor checks
//     or see ./getMatch.test.ts for Jest tests
/*
function chk(a, path, b) { // check that getMatch() works as expected to return b from a at path
  const [match,parent,key] = getMatchParentKey(a, path); 
  return (
    (_.isEqual(parent?.[key], b) &&  _.isEqual(match, b))
    || 
    (_.isEqual(a,b)              &&  _.isEqual(match, b))
    ) ? 'PASS' : 'FAIL => '+match
}
const obj = {a:{b:{c:{d:'value'}}}}
chk( obj, '', obj                    ) //=
chk( obj, 'a', obj.a                 ) //=
chk( obj, 'a.b', obj.a.b             ) //=
chk( obj, 'a.b.c', obj.a.b.c         ) //=
chk( obj, 'a.b.c.d', obj.a.b.c.d     ) //=
chk( obj, 'a.b.c.d', 'value'         ) //=
chk( obj, 'a.b.c.d:value',  'value'  ) //=
chk( obj, 'a.b.c.d:/lue$/', 'value'  ) //=

const obj2 = {a:{b:{c:[3,5,7]}}}
chk( obj2, 'a.b.c[1]', 5             ) //=
chk( obj2, 'a.b.c.1',  5             ) //=
chk( obj2, 'a.b.c', obj2.a.b.c       ) //=
chk( obj2, 'a.b.c',  [3,5,7]         ) //=
*/