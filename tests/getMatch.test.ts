import { getMatch, getMatchParentKey } from '../src/getMatch';
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

describe('getMatchParentKey', () => {
  const obj = {
    a: {
      b: {
        c: {
          d: 'value',
        },
      },
    },
  }

  test('should return deep value, parent object and key', () => {
    const [match, parentObj, key] = getMatchParentKey(obj, 'a.b.c.d:value');
    expect(match    ).toEqual('value')
    expect(parentObj).toEqual(obj.a.b.c)
    expect(key      ).toEqual('d')
  })

  test('should return a deep object, its parentObj and a key', () => {
    const [match, parentObj, key] = getMatchParentKey(obj, 'a.b.c');
    expect(match    ).toEqual(obj.a.b.c)
    expect(parentObj).toEqual(obj.a.b)
    expect(key      ).toEqual('c')
  })

  test('should return top object, its parentObj and a key', () => {
    const [match, parentObj, key] = getMatchParentKey(obj, 'a');
    expect(match    ).toEqual(obj.a)
    expect(parentObj).toEqual(obj)
    expect(key      ).toEqual('a')
  })

  test('should return undefined for parent object and empty string for key if match not found', () => {
    const [match, parentObj, key] = getMatchParentKey(obj, 'a.b.c.d:an_unfindable_value_to_test');
    expect(match    ).toBeUndefined()
    expect(parentObj).toBeUndefined()
    expect(key      ).toBeUndefined()
  })

  test('should return entire object if matchStr is empty string', () => {
    const [match, parentObj, key] = getMatchParentKey(obj, '');
    expect(match    ).toEqual(obj)
    expect(parentObj).toBeUndefined()
    expect(key      ).toEqual('')
  })
})
