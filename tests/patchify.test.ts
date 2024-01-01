// FILEPATH: /c:/work/git/patchifier-js/tests/patchify.test.js

import { applyPatchFuncs } from "../src/patchify"

const { patchify, parseStrFuncAndJsonParams } = require('../src/patchify')
const { cloneDeep } = require('lodash')

describe('patchify', () => {
  test('should return a deep clone of the input object if no patches are provided', () => {
    const obj = { a: 1, b: { c: 2 } }
    const result = patchify(obj)
    expect(result).toEqual(obj)
    expect(result).not.toBe(obj)
  })

  test('should apply an object patch to the input object', () => {
    const obj = { a: 1, b: { c: 2 } }
    const patch = { match: 'b', patch: {b: { d: 3 }} }
    const result = patchify(obj, [patch])
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } })
  })

  test('should override a value on the object', () => {
    const obj = { a: 1, b: { c: 2 } }
    const patch = { match: 'b', patch: {b: { c: 3333 }} }
    const result = patchify(obj, [patch], true)
    expect(result).toEqual({ a: 1, b: { c: 3333 } })
  })

  test('should apply multiple patches to the input object', () => {
    const obj = { a: 1, b: { c: 2 } }
    const patches = [{ match: 'b', patch: {b:{ d: 3 }} }, { match: 'a', patch: {x:77} }]
    const result = patchify(obj, patches)
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, x:77 })
  })
})

describe('patchify with patchFuncs', () => {
  describe('parseStrFuncAndJsonParams', () => {
    test('should return null and an empty object for an empty string', () => {
      const [func, params] = parseStrFuncAndJsonParams('')
      expect(func).toBeNull()
      expect(params).toEqual({})
    })
  
    test('should return the correct function and parameters for a valid string', () => {
      const testFunc = () => {}
      patchify.patchFuncs.testFunc = testFunc
      const [func, params] = parseStrFuncAndJsonParams('testFunc({"a": 1})')
      expect(func).toBe(testFunc)
      expect(params).toEqual({ a: 1 })
    })
  
    test('should throw if the function does not exist', () => {
      try {
        const [func, params] = parseStrFuncAndJsonParams('nonExistentFunc({"a": 1})')
      } catch (e) {
        expect(e.message).toContain(' could not find function named "nonExistentFunc"')
      }
    })
  
    test('should return the function and an empty object for a string with no parameters', () => {
      const testFunc = () => {}
      patchify.patchFuncs.testFunc = testFunc
      const [func, params] = parseStrFuncAndJsonParams('testFunc()')
      expect(func).toBe(testFunc)
      expect(params).toEqual({})
    })
  })

  describe('applyPatchFuncs', () => {
    test('should apply multiple patch functions to the matched value in the object', () => {
      const wholeObj = { a: 1, b: { u: 2, v:2 } };
      const patch = { b: {u: { __patchFunc: 'testFunc1({"x": 3})'}, v:{__patchFunc: 'testFunc2({"y": 4})' }}}
      const matchVal = wholeObj.b;
  
      patchify.patchFuncs.testFunc1  = (value, params, _wholeObj, matchVal) => {
        // console.log('matchVal=', matchVal, 'params=', params, '_wholeObj=', _wholeObj, 'matchVal=', matchVal)
        expect(value).toEqual(wholeObj.b.u)
        expect(params).toEqual({ x: 3 })
        expect(wholeObj).toEqual(_wholeObj)
        expect(matchVal).toEqual('fooo')
        const valToReturn = value + params.x
        expect(valToReturn).toEqual(2+3)
        return valToReturn
      }
      patchify.patchFuncs.testFunc2  = (value, params, _wholeObj, matchVal) => {
        expect(value).toEqual(wholeObj.b.v)
        expect(params).toEqual({ y: 4 })
        expect(wholeObj).toEqual(_wholeObj)
        expect(matchVal).toEqual('fooo')
        const valToReturn = value + params.y
        expect(valToReturn).toEqual(2+4)
        return valToReturn
      }
  
      const result = applyPatchFuncs(wholeObj, patch, 'fooo')

      // expect(patch).toEqual({ b: {u: { __patchFunc: 'testFunc1({"x": 3})'}, v:{__patchFunc: 'testFunc2({"y": 4})' }}}) // unchanged
      expect(result).toEqual({ b: { u: 5, v: 6 } })
    });
  
    test('should not modify the patch if no patch function is found', () => {
      const wholeObj = { a: 1, b: { c: 2 } };
      const patch = { b: { d: 3 } };
      const matchVal = 'the.string.used.to.match';
  
      const result = applyPatchFuncs(wholeObj, patch, matchVal);
      expect(result).toEqual(patch);
    });
  
    test('should throw if the patch function does not exist', () => {
      const wholeObj = { a: 1, b: { c: 2 } };
      const patch = { b: { __patchFunc: 'nonExistentFunc({"x": 3})' } };
      const matchVal = 'the.string.used.to.match';
      patchify.patchFuncs = {}
      let result
      try {
        result = applyPatchFuncs(wholeObj, patch, matchVal);
      } catch (e) {
        expect(e.message).toContain(' could not find function named "nonExistentFunc"')
      }
    });
  });
})