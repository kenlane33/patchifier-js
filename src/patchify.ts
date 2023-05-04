import { cloneDeep, defaultsDeep } from 'lodash'
import { Obj_ish, Val_ish, PatchFunc, Patch, PatchFuncsByName, PatchFuncByName_NotEmpty } from './patchifierTypes';
import { getMatch } from './getMatch';
import { addCorePatchFuncs } from './core_PatchFuncs';


function isObject(item: unknown): boolean {
  if (item === null || item === undefined) return false
  return (typeof item === 'object')
}

function safeJsonParse(str: string): unknown {
  try { return JSON.parse(str) }
  catch (e) { return str }
}

/**
 * 
 * Parse a string into a function name and json params, return the looked up function & JSON-parsed params.
 * Example: parseStrFuncAndJsonParams('mapKeys({a:1})') => [ [Function:mapKeys], {a:1}]
 * 
 * @param str - a string that may contain a function name and/or json params in parens. Ex: 'get_val(a.b)', 'matches(/^fun/)'
 * @returns 
 */
function parseStrFuncAndJsonParams( str:string ) : [PatchFunc|null, unknown] {
  const funcName   = str.match(/^[a-zA-Z0-9_]+/)?.[0]
  const jsonParams = str.match(/\((.*)\)/)?.[1] || '{}' //=
  const func       = (funcName && patchify.patchFuncs[funcName]) || null //=
  const parseParams = safeJsonParse(jsonParams) //=
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
export function applyPatchFuncs( wholeObj:Obj_ish, patch: Obj_ish, matchVal: Val_ish  ): Obj_ish {
  function digForFuncs(obj: Obj_ish, parentObj?: Obj_ish, parentKey?: string) {
    Object.entries(obj).forEach(([key, val]) => {
      if (key==='__patchFunc') {
        const [patchFunc, jsonParams] = parseStrFuncAndJsonParams(val as string) as [PatchFunc|null, unknown]
        if (patchFunc && parentObj && parentKey) {
          parentObj[parentKey] = patchFunc(matchVal, jsonParams, wholeObj)
        }
      }
      else if (isObject(val)) digForFuncs(val as Obj_ish, obj, key)
    })
  }
  digForFuncs(patch) 
  return patch // for chaining if useful
}

/**
 *
 * For each match in the matchesToPatch array, deeply apply the patch object to the object obj.
 * Includes special {"__patchFunc":()=>any} objects in the patch object, and replaces those with the result of each function in place.
 *
 * @param obj - the object to look for matches in (and patch the matching ones)
 * @param matchesToPatch - array of {match:string, patch:object} objects that deeply apply a patch object if match (a matching path) is found in obj
 * @returns the patched object
 */
export function patchify(obj: Obj_ish, matchesToPatch: Patch[] = []): Obj_ish {
  // const objCopy = JSON.parse(JSON.stringify(obj))
  const objCopy = cloneDeep(obj);
  for (const { match, patch } of [...patchify.defaultPatches, ...matchesToPatch]) {
    const matchObj = getMatch(obj, match);
    if (matchObj) {
      const patchWFuncVals = applyPatchFuncs(obj, patch, matchObj); //= matchObj
      obj = defaultsDeep(objCopy, patchWFuncVals) as Obj_ish; // merge each patch without stomping on existing values
    }
  }
  return obj; //=
}

//==== PATCHIFY STATIC PROPERTIES ======================================================================================
patchify.defaultPatches = [] as Patch[];
patchify.addPatch = (patch_s_: (Patch | Patch[])) => {
  if (Array.isArray(patch_s_))
    return patch_s_.forEach(patchify.addPatch);
  else
    patchify.defaultPatches.push(patch_s_);
};
patchify.patchFuncs = {} as PatchFuncsByName;
patchify.addPatchFunc = (patchFnByFnNm: (PatchFuncByName_NotEmpty)) => {
  Object.assign(patchify.patchFuncs, patchFnByFnNm); //= patchFnByFnNm
};


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
// ])

addCorePatchFuncs()
console.log(patchify)

// patchify(
//   { llm: {
//       model_name: "text-davinci-003",
//       override: 'AAA!',
//     },
//     prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
//   }
// ) //= 