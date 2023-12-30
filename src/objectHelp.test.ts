import { recurseTwoSimilarObjects, recurseObject } from "./objectHelp";

describe('recurseTwoSimilarObjects', () => {
  test('should call the callback for each key-value pair in the sparse object', () => {
    const sparseObj = { a: 1, b: { c: 2 } };
    const fullObj = { a: 1, b: { c: 2, d: 3 }, e: 4 };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(sparseObj, fullObj, 'a', 1);
    expect(callback).toHaveBeenCalledWith(sparseObj.b, fullObj.b, 'c', 2);
  });

  test('should not call the callback for keys not present in the sparse object', () => {
    const sparseObj = { a: 1 };
    const fullObj = { a: 1, b: 2 };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(sparseObj, fullObj, 'a', 1);
  });

  test('should recurse into nested objects', () => {
    const sparseObj = { a: { b: { c: 1 } } };
    const fullObj = { a: { b: { c: 1, d: 2 }, e: 3 }, f: 4 };
    const callback = jest.fn();

    recurseTwoSimilarObjects(sparseObj, fullObj, callback);

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenCalledWith(sparseObj.a, fullObj.a, 'b', sparseObj.a.b);
    expect(callback).toHaveBeenCalledWith(sparseObj.a.b, fullObj.a.b, 'c', 1);
  });
});
describe('recurseObject', () => {
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