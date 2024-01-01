import { recurseTwoSimilarObjects, recurseObject, safeJsonParse } from "../src/objectHelp";

describe('recurseTwoSimilarObjects()', () => {
  test('should call the callback for each key-value pair in the sparse object', () => {
    const sparseObj = { a: 1, b: { c: 2 } };
    const fullObj = { a: 11, b: { c: 22, d: 33 }, e: 44 };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(sparseObj, fullObj, 'a', 1, 11);
    expect(callback).toHaveBeenCalledWith(sparseObj, fullObj, 'b', { c: 2 }, { c: 22, d: 33 });
    expect(callback).toHaveBeenCalledWith(sparseObj.b, fullObj.b, 'c', 2, 22);
  });

  test('should not call the callback for keys not present in the sparse object', () => {
    const sparseObj = { a: 1 };
    const fullObj = { a: 11, b: 22 };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(sparseObj, fullObj, 'a', 1, 11);
  });

  test('should recurse into nested objects', () => {
    const sparseObj = { a: { b: { c: 1 } } };
    const fullObj = { a: { b: { c: 11, d: 22 }, e: 33 }, f: 44 };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(sparseObj.a, fullObj.a, 'b', sparseObj.a.b, fullObj.a.b);
    expect(callback).toHaveBeenCalledWith(sparseObj.a.b, fullObj.a.b, 'c', 1, 11);
  });
  test('should survive an object part defined only in the fullObj', () => {
    const sparseObj = { a: { b: { c: 1 } } };
    const fullObj = { a: { } };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(sparseObj,     fullObj  , 'a', sparseObj.a,   fullObj.a);
    expect(callback).toHaveBeenCalledWith(sparseObj,     fullObj  , 'a', {b:{c:1}},     {}       );
    expect(callback).toHaveBeenCalledWith(sparseObj.a,   fullObj.a, 'b', sparseObj.a.b, undefined);
    expect(callback).toHaveBeenCalledWith({b:{c:1}},            {}, 'b', {c:1},         undefined);
    expect(callback).toHaveBeenCalledWith(sparseObj.a.b, undefined, 'c', 1,             undefined);
  });
});
//==================================================================================================
describe('recurseObject()', () => {
  test('should call the callback for each key-value pair in the object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const callback = jest.fn();

    recurseObject(obj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(obj, 'a', 1); // each leaf
    expect(callback).toBeCalledWith( expect.objectContaining({ c: 2 }), 'c', 2 ) // each branch, such that matches obj.b by value...
    expect(callback).not.toHaveBeenCalledWith(obj.b, 'b', obj.b); // ...but not by reference
    expect(callback).toHaveBeenCalledWith(obj.b, 'c', 2); // each leaf
  });

  test('should not call the callback for null values', () => {
    const obj = { a: null };
    const callback = jest.fn();

    recurseObject(obj, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(obj, 'a', null);
  });

  test('should recurse into nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const callback = jest.fn();

    recurseObject(obj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(obj, 'a', obj.a);
    expect(callback).toHaveBeenCalledWith(obj.a, 'b', obj.a.b);
    expect(callback).toHaveBeenCalledWith(obj.a.b, 'c', 1);
  });
});
//==================================================================================================
describe('safeJsonParse()', () => {
  test('should return the parsed object for a valid JSON string', () => {
    const obj = { a: 1, b: { c: 2 } };
    const str = JSON.stringify(obj);
    expect(safeJsonParse(str)).toEqual(obj);
  });

  test('should return the original string for an invalid JSON string', () => {
    const str = 'not valid JSON';
    expect(safeJsonParse(str)).toEqual(str);
  });
  test('should return the original string for an empty string', () => {
    const str = '';
    expect(safeJsonParse(str)).toEqual(str);
  });
});
