// FILEPATH: /c:/work/git/patchifier-js/tests/patchify.test.js

const { patchify, parseStrFuncAndJsonParams } = require('../src/patchify');
const { cloneDeep } = require('lodash');

describe('patchify', () => {
  test('should return a deep clone of the input object if no patches are provided', () => {
    const obj = { a: 1, b: { c: 2 } };
    const result = patchify(obj);
    expect(result).toEqual(obj);
    expect(result).not.toBe(obj);
  });

  test('should apply a patch to the input object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const patch = { match: 'b', patch: {b: { d: 3 }} };
    const result = patchify(obj, [patch]);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 } })
  });

  test('should apply multiple patches to the input object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const patches = [{ match: 'b', patch: {b:{ d: 3 }} }, { match: 'a', patch: {x:77} }];
    const result = patchify(obj, patches);
    expect(result).toEqual({ a: 1, b: { c: 2, d: 3 }, x:77 });
  });
});

describe('patchify with patchFuncs', () => {
  describe('parseStrFuncAndJsonParams', () => {
    test('should return null and an empty object for an empty string', () => {
      const [func, params] = parseStrFuncAndJsonParams('');
      expect(func).toBeNull();
      expect(params).toEqual({});
    });
  
    test('should return the correct function and parameters for a valid string', () => {
      const testFunc = () => {};
      patchify.patchFuncs.testFunc = testFunc;
      const [func, params] = parseStrFuncAndJsonParams('testFunc({"a": 1})');
      expect(func).toBe(testFunc);
      expect(params).toEqual({ a: 1 });
    });
  
    test('should return null and the correct parameters if the function does not exist', () => {
      const [func, params] = parseStrFuncAndJsonParams('nonExistentFunc({"a": 1})');
      expect(func).toBeNull();
      expect(params).toEqual({ a: 1 });
    });
  
    test('should return the function and an empty object for a string with no parameters', () => {
      const testFunc = () => {};
      patchify.patchFuncs.testFunc = testFunc;
      const [func, params] = parseStrFuncAndJsonParams('testFunc()');
      expect(func).toBe(testFunc);
      expect(params).toEqual({});
    });
  });
})