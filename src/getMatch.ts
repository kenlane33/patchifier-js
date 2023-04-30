import {get as _get } from 'lodash'

function getMatch(obj: Record<string, unknown>, matchStr: string): unknown {
  const [path, value] = matchStr.split(":")
  const regExpStr = (value && value.match(/^\/(.*)\/$/)?.[1]) //=
  const valueRegExp = regExpStr ? new RegExp(regExpStr) : undefined //=
  const objValue = _get(obj, path); //=
  if (value === undefined) {
    return objValue;
  } else {
    if (valueRegExp) {
      return valueRegExp.test(objValue as string) ? objValue : undefined;
    } else {
      return objValue+'' === value ? objValue : undefined;
    }
  }
}
const testObj = {
  a: {
    b: 42,
    c: 'hello',
    d: 'World',
    t:true,
  }
};

function chk( val, expectedVal ) {
  return (val == expectedVal) ? ['PASS',val] : ['FAIL',val]
}

// matching exact value
chk(getMatch(testObj, 'a.b:42'),    42       ) //=
chk(getMatch(testObj, 'a.c:hello'), 'hello'  ) //=
chk(getMatch(testObj, 'a.c:world'), null     ) //=
chk(getMatch(testObj, 'a.t:true'),  true     ) //=


// matching with regex
chk(getMatch(testObj, 'a.d:/^W/'), 'World'  ) //=
chk(getMatch(testObj, 'a.d:/^H/'), undefined) //=

// matching without colon (any value matches)
chk(getMatch(testObj, 'a.b'), 42       ) //=
chk(getMatch(testObj, 'a.c'), 'hello'  ) //=
chk(getMatch(testObj, 'a.d'), 'World'  ) //=
chk(getMatch(testObj, 'a.e'),      null) //=
chk(getMatch(testObj, 'a.e'), undefined) //=
