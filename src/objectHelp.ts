
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

export const recurseTwoSimilarObjects = (sparseObj, fullObj, callback: (sparseObj, fullObj, key, sparseVal, fullVal) => void) => {
  Object.entries(sparseObj).forEach(([key, sparseVal]) => {
    const fullVal = fullObj?.[key]
    // console.log('sparseObj=', sparseObj, 'fullObj=', fullObj, 'key=', key, 'sparseVal=', sparseVal, 'fullVal=', fullVal)
    callback(sparseObj, fullObj, key, sparseVal, fullVal)

    if (typeof sparseVal === 'object' && sparseVal !== null) {
      recurseTwoSimilarObjects(sparseVal, fullObj[key], callback)
    }
  })
}