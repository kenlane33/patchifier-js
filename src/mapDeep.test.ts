const _ = require('lodash')
const { mapKeysDeep, mapValuesDeep } = require('./mapDeep')

describe('mapKeysDeep', () => {
  test('should alter keys of object and sub-objects per output of callback() with good key and value params', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const exp = { A: { C2: 2 }, D: [ { X7: 7 }, { Y8: 8 } ] }
    const res = mapKeysDeep(testObj, (obj, k, v) => k.toUpperCase() + (_.isObject(v) ? '' : v))
    expect(res).toEqual(exp)
    expect(res).not.toBe(testObj) // should not mutate original object
  })

  test('should keep type of values intact during mapping. Ex: 2 + 2 == 4, not "2"+2 == "22"', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const exp = { a: { c4: 2 }, d: [ { x9: 7 }, { y10: 8 } ] }
    const res = mapKeysDeep(testObj, (obj, k, v) => k + (_.isObject(v) ? '' : v + 2))
    expect(res).toEqual(exp)
    expect(res).not.toBe(testObj) // should not mutate original object
  })

  test('should not mutate original object', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const res = mapKeysDeep(testObj, (obj, k, v) => k + (_.isObject(v) ? '' : v + 2))
    expect(res).not.toBe(testObj)
  })
})

describe('mapValuesDeep', () => {
  test('should map new values to return of callback() with good (key and value) parameters', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const exp = { a: { c: 'C==2' }, d: [ { x: 'X==7' }, { y: 'Y==8' } ] }
    const res = mapValuesDeep(testObj, (obj, k, v) => `${k.toUpperCase()}==${v}`)
    expect(res).toEqual(exp)
    expect(res).not.toBe(testObj)
  })

  test('should keep type of values intact during mapping. i.e. 2 + 2 == 4, not "2"+2 == "22"', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const exp = { a: { c: 'c+2 == 4' }, d: [ { x: 'x+2 == 9' }, { y: 'y+2 == 10' } ] }
    const res = mapValuesDeep(testObj, (obj, k, v) => `${k}+2 == ${v+2}`)
    expect(res).toEqual(exp)
    expect(res).not.toBe(testObj)
  })

  test('should map new values to return of callback() with good (parentObj, key, and value) parameters', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const exp = { a: { c: '{"c":2}.c == 2' }, d: [ { x: '{"x":7}.x == 7' }, { y: '{"y":8}.y == 8' } ] }
    const res = mapValuesDeep(testObj, (obj, k, v) => `${JSON.stringify(obj)}.${k} == ${v}`)
    expect(res).toEqual(exp)
    expect(res).not.toBe(testObj) // should not mutate original object
  })
  test('should not mutate original object', () => {
    const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
    const res = mapValuesDeep(testObj, (obj, k, v) => `${JSON.stringify(obj)}.${k} == ${v}`)
    expect(res).not.toBe(testObj)
  })
})
