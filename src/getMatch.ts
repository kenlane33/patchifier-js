import {get as _get } from 'lodash'

/**
 * 
 * Use matchStr path to get a matching deep value from an object.
 * 
 * @param obj - object to search
 * @param matchStr - lodash path, then an optional : and value or regExp to match. Examples: 'a.b' or 'a.b:42' or 'a.b:/^4/'
 * @returns matching object value, or undefined if no match
 */
export function getMatch(obj: Record<string, unknown>, matchStr: string): unknown {
  if (matchStr=='') return obj
  const [path, matchVal] = matchStr.split(":")
  const objVal    = _get(obj, path)
  if (matchVal === undefined) return objVal                         // example: getMatch({a:{b:42}},      'a.b') => 42
  const regExpStr = matchVal && matchVal.match(/^\/(.*)\/$/)?.[1]
  const regExp    = regExpStr && new RegExp(regExpStr)
  const strVal    = objVal + ''
  if (regExp) return (regExp.test(strVal))  ?  objVal  :  undefined // example: getMatch({a:{b:42}}, 'a.b:/^4/') => 42
  else        return (strVal === matchVal)  ?  objVal  :  undefined // example: getMatch({a:{b:42}}, 'a.b:42'  ) => 42
}

const testObj = {
  a: {
    b: 42,
    c: 'hello',
    d: 'World',
    f: false,
    t: true,
    arr: [6,7,8]
  }
};

function chkEql( a, b ) {
  return (Array.isArray(a))   ?   
    (a.length == b.length ) && a.some( (v,i) => v == b[i] ) 
      :
    (a == b)
}
function chk( a, b ) {
  return (chkEql(a,b)) ? ['💚PASS', a] : ['❌FAIL', a]
}
function chkNot( val, expectedVal ) {  
  return (chkEql(val, expectedVal)) ? ['🔴FAIL',val] : ['🟢PASS',val]
}
// matching exact value
chk(   getMatch(testObj, ''),          testObj  ) //=
chk(   getMatch(testObj, 'a.b:42'),     42      ) //=
chk(   getMatch(testObj, 'a.c:hello'), 'hello'  ) //=
chk(   getMatch(testObj, 'a.c:world'), null     ) //=
chk(   getMatch(testObj, 'a.t:true'),  true     ) //=
chk(   getMatch(testObj, 'a.arr'),     [6,7,8]  ) //=
chkNot(getMatch(testObj, 'a.arr'),     [6,7,8,9]) //=

// matching with regex
chk(getMatch(testObj, 'a.b:/.*/'),  42      ) //=
chk(getMatch(testObj, 'a.d:/^W/'), 'World'  ) //=
chk(getMatch(testObj, 'a.d:/^Q/'), undefined) //=
chk(getMatch(testObj, 'a.b:/^4/'),  42      ) //=
chk(getMatch(testObj, 'a.b://'  ), undefined) //=

// matching without colon (any value matches)
chk(   getMatch(testObj, 'a.b'),  42      ) //=
chk(   getMatch(testObj, 'a.c'), 'hello'  ) //=
chk(   getMatch(testObj, 'a.d'), 'World'  ) //=
chk(   getMatch(testObj, 'a.t'), true     ) //=
chk(   getMatch(testObj, 'a.f'), false    ) //=
chkNot(getMatch(testObj, 'a.f'), null     ) //=
chkNot(getMatch(testObj, 'a.f'), undefined) //=
chk(   getMatch(testObj, 'a.e'),      null) //=
chk(   getMatch(testObj, 'a.e'), undefined) //=
