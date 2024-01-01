import {  get as _get, cloneDeep, defaultsDeep, mergeWith, isObject } from 'lodash'
import { Obj_ish, Val_ish, PatchFunc, Patch, PatchFuncsByName, PatchFuncByName_NotEmpty } from './patchifierTypes'
import { getMatchParentKey } from './getMatch'
import { addCorePatchFuncs } from './core_PatchFuncs'
import { safeJsonParse, recurseTwoSimilarObjects } from "./objectHelp"

/**
 * 
 * Parse a string into a function name and json params, return the looked up function & JSON-parsed params.
 * Example: parseStrFuncAndJsonParams('mapKeys({a:1})') => [ [Function:mapKeys], {a:1}]
 * 
 * @param str - a string that may contain a function name and/or json params in parens. Ex: 'get_val(a.b)', 'matches(/^fun/)'
 * @returns 
 */
export function parseStrFuncAndJsonParams( str:string ) : [PatchFunc|null, any] {
  const funcName   = str.match(/^[a-zA-Z0-9_]+/)?.[0]
  const jsonParams = str.match(/\((.*)\)/)?.[1] || '{}' //=
  const func       = (funcName && patchify.patchFuncs[funcName]) || null //=
  const parseParams = safeJsonParse(jsonParams) //=
  // throw if funcName is not a function
  if (funcName && !func) throw new Error(`parseStrFuncAndJsonParams() could not find function named "${funcName}"`)
  return [func, parseParams]
}

/**
 * 
 * Looks for special {"__patchFunc":()=>any} objects in the patch object, and replaces each object with the result of its function in place.
 * 
 * @param wholeObj - the whole object ONLY so that functions can access other parts of the object
 * @param patch - a "patch" object that will have its {__patchFunc:()=>any} _objects_ replaced (in place) with the result of the function
 * @param matchVal - the value that was matched in the original object to cause this match-patch to be applied
 * @returns the patch object with each function object replaced with its result
 */
export function applyPatchFuncs(wholeObj:any, patch:any, matchVal:Val_ish) {
  recurseTwoSimilarObjects(patch, wholeObj, (curPatch, curWholeObj, key, val) => {
    const isObj = isObject(val)
    const pFnStr = isObj && val['__patchFunc']
    if (pFnStr) {
      const [patchFunc, jsonParams] = parseStrFuncAndJsonParams(pFnStr) || [null, null]
      // console.log('===applyPatchFuncs()===\n', 'curPatch=', curPatch, 'curWholeObj=', curWholeObj, 'key=', key, 'val=', val, 'jsonParams=', jsonParams )
      if (patchFunc && curPatch && curWholeObj && key) {
        const b4 = JSON.stringify(curPatch[key])
        curPatch[key] = patchFunc(curWholeObj[key], jsonParams, wholeObj, matchVal)
        // console.log('key=',key, ', curWholeObj[key]=', curWholeObj[key], ', matchVal=', matchVal)
      }
    }
  });
  return patch
}

/**
 *
 * For each match in the matchesToPatch array, deeply apply the patch object to the object obj _without_ replacing existing values.
 * Includes special {"__patchFunc":()=>any} objects in the patch object, and replaces those with the result of each function in place.
 *
 * @param obj - the object to look for matches in (and patch the matching ones)
 * @param matchesToPatch - array of {match:string, patch:object} objects that deeply apply a patch object if match (a matching path) is found in obj
 * @returns the patched object
 */
export function patchify(obj: Obj_ish, matchesToPatch: Patch[] = [], canStomp=false): Obj_ish {
  // const objCopy = JSON.parse(JSON.stringify(obj))
  let objCopy = cloneDeep(obj)
  for (const { match, patch } of [...patchify.defaultPatches, ...matchesToPatch]) {
    const [matched, parObj, key ] = getMatchParentKey(objCopy, match)
    // console.log('matched=', matched, 'parObj=', parObj, 'key=', key)
    if (matched) {
      const patchWFuncVals = applyPatchFuncs(objCopy, patch, matched)
      // console.log('patchWFuncVals=', patchWFuncVals)
      objCopy = ((canStomp) ? 
        Object.assign(objCopy, patchWFuncVals) // merge each patch, stomping on existing values
        :
        defaultsDeep( objCopy, patchWFuncVals) // merge each patch without stomping on existing values
      ) as Obj_ish 
    }
  }
  return objCopy
}

//==== PATCHIFY STATIC PROPERTIES ======================================================================================
patchify.defaultPatches = [] as Patch[]
/* 
  * patchify.addPatch() adds a patch or array of patches to the defaultPatches array.
  * @param patch_s_ - a single Patch object or an array of Patch objects
  */
patchify.addPatch = (patch_s_: (Patch | Patch[])) => {
  if (Array.isArray(patch_s_))
    return patch_s_.forEach(patchify.addPatch)
  else
    patchify.defaultPatches.push(patch_s_)
};
patchify.patchFuncs = {} as PatchFuncsByName
/* 
  * patchify.addPatchFunc() adds a object of patchFuncsByNm to the static patchify.patchFuncs object.
  * For example: patchify.addPatchFunc({get_val, matches, curly_vars_to_array})
  * or:          patchify.addPatchFunc( {reportFn:(_obj:Obj_ish, k:Key_ish, v:Val_ish)=>`o[${k}]=${v}`} )
  * @param patchFnByFnNm - a single PatchFuncByName_NotEmpty object or an array of PatchFuncByName_NotEmpty objects
  */
patchify.addPatchFunc = (patchFnByFnNm: (PatchFuncByName_NotEmpty)) => {
  Object.assign(patchify.patchFuncs, patchFnByFnNm) // merge in the new patchFuncs
}

addCorePatchFuncs() // adds funcs like 'matches', 'curly_vars_to_array', etc.

//=== TEST =============================================================================================================
// patchify.addPatch([
//   { "match": "llm.model_name:/text-davinci/", 
//     "patch": {"llm":{"_type": "openai"}}
//   },
//   { match: 'prompt.template', // if obj.prompt.template exists
//     patch: {input_key: { __patchFunc:'curly_vars_first()' }}, // then obj.input_key = the first string in curly vars in obj.prompt.template
//   },
//   { match: 'prompt.template',
//     patch: {bbb: { __patchFunc:'matches(\{([a-zA-Z0-9]+)\})' }},
//   },
//   { match: 'prompt.template',
//     patch: {ccc: { __patchFunc:'matches(/\{([a-zA-Z0-9]+)\}/)' }},
//   },
//   { match: 'prompt.template', // the value of  prompt.template  will be passed to the __patchFunc
//     patch: {prompt:{
//       //output_parser: null,
//       //template_format: 'f-string',
//       //_type: 'prompt',
//       input_variables: { __patchFunc:'curly_vars_to_array()' },
//     }},
//   },
//   { match: 'llm._type:openai', 
//     patch: {
//       llm:{ aaa: { __patchFunc:'get_val(llm.override)' } }
//     }
//   },
// ]) //= 


// const x = patchify(
//   { llm: {
//       model_name: "text-davinci-003",
//       override: 'AAA!',
//     },
//     prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
//   }
// )
// console.log('=====patchify.ts=====\n', x)