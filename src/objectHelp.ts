export function isObject(item: unknown): boolean {
  if (item === null || item === undefined) return false;
  return (typeof item === 'object');
}

export function safeJsonParse(str: string): unknown {
  try { return JSON.parse(str)} 
  catch (e) { return str} 
}

export function recurseObject(parObj, callback) {
  Object.entries(parObj).forEach(([key, value]) => {
    callback(parObj, key, value)

    if (typeof value === 'object' && value !== null) {
      recurseObject(value, callback)
    }
  })
}

export const recurseTwoSimilarObjects = (sparseObj, fullObj, callback: (sparseObj, fullObj, key, value) => void) => {
  Object.entries(sparseObj).forEach(([key, value]) => {
    callback(sparseObj, fullObj, key, value)

    if (typeof value === 'object' && value !== null) {
      recurseTwoSimilarObjects(value, fullObj[key], callback)
    }
  })
}