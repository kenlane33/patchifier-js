import { getMatch } from './getMatch'

const testObj = {
  a: {
    b: 42,
    c: 'hello',
    d: 'World',
    e: null,
    t: true,
    f: false,
    arr: [6, 7, 8],
  },
  x:{y:{z:{}}}
}

describe('getMatch() function tests', () => {
  test('getMatch() with empty string returns full object', () => {
    expect(getMatch(testObj, ''         )).toEqual(  testObj)
  })

  test('getMatch() with path and value returns the exact matching value', () => {
    expect(getMatch(testObj, 'a.b:42'   )).toEqual(       42)
    expect(getMatch(testObj, 'a.c:hello')).toEqual(  'hello')
    expect(getMatch(testObj, 'a.c:world')).toBeUndefined(   )
    expect(getMatch(testObj, 'a.t:true' )).toEqual(     true)
    expect(getMatch(testObj, 'a.arr'    )).toEqual([6, 7, 8])
  })

  test('getMatch() with path and RegExp value returns the matching value', () => {
    expect(getMatch(testObj, 'a.b:/.*/' )).toEqual(     42)
    expect(getMatch(testObj, 'a.d:/^W/' )).toEqual('World')
    expect(getMatch(testObj, 'a.d:/^Q/' )).toBeUndefined( )
    expect(getMatch(testObj, 'a.b:/^4/' )).toEqual(     42)
    expect(getMatch(testObj, 'a.b://'   )).toBeUndefined( )
  })

  test('getMatch() without value returns any matching value', () => {
    expect(getMatch(testObj, 'a.b'      )).toEqual(     42)
    expect(getMatch(testObj, 'a.c'      )).toEqual('hello')
    expect(getMatch(testObj, 'a.d'      )).toEqual('World')
    expect(getMatch(testObj, 'a.t'      )).toEqual(   true)
    expect(getMatch(testObj, 'a.f'      )).toEqual(  false)
    expect(getMatch(testObj, 'a.e'      )).toBeNull(      )
  });
});
