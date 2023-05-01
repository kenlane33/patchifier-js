import {get as _get, find, set as _set } from 'lodash'

/**
 * 
 * Use matchStr path to get a matching deep value from an object.
 * 
 * @param obj - object to search
 * @param matchStr - lodash path, then an optional : and value or regExp to match. Examples: 'a.b' or 'a.b:42' or 'a.b:/^4/'
 * @returns matching object value, or undefined if no match
 */
export function getMatch(obj: Record<string, unknown>, matchStr: string): unknown {
  if (matchStr=='') return obj
  const [path, matchVal] = matchStr.split(":")
  const objVal    = _get(obj, path)
  if (matchVal === undefined) return objVal                         // example: getMatch({a:{b:42}},      'a.b') => 42
  const regExpStr = matchVal && matchVal.match(/^\/(.*)\/$/)?.[1]
  const regExp    = regExpStr && new RegExp(regExpStr)
  const strVal    = objVal + ''
  if (regExp) return (regExp.test(strVal))  ?  objVal  :  undefined // example: getMatch({a:{b:42}}, 'a.b:/^4/') => 42
  else        return (strVal === matchVal)  ?  objVal  :  undefined // example: getMatch({a:{b:42}}, 'a.b:42'  ) => 42
}
