import { _, merge, get as _get } from 'lodash'
import { getMatch, getMatchParentKey } from './getMatch'
import { Obj_ish, MatchRet, Val_ish, PatchFunc, Patch, PatchFuncsByName, PatchFuncByName_NotEmpty, PatchFuncArgs, PatchFuncRet } from './patchifierTypes'

function isObject(item: unknown): boolean {
  if (item === null || item === undefined) return false
  return (typeof item === 'object')
}

function parseStringAsJsonOrString(str: string): unknown {
  try { return JSON.parse(str) }
  catch (e) { return str }
}

function parseStrFuncAndJsonParams( str:string ) : [PatchFunc|null, unknown] {
  const funcName   = str.match(/^[a-zA-Z0-9_]+/)?.[0]
  const jsonParams = str.match(/\((.*)\)/)?.[1] || '{}' //=
  const func       = (funcName && patchify.patchFuncs[funcName]) || null //=
  const parseParams = parseStringAsJsonOrString(jsonParams) //=
  return [func, parseParams]
}

/**
 * 
 * Looks for special {"__patchFunc":()=>any} objects in the patch object, and replaces each object with the result of its function.
 * 
 * @param wholeObj - the whole object ONLY so that functions can access other parts of the object
 * @param patch - a "patch" object that will have its {__patchFunc:()=>any} _objects_ replaced with the result of the function
 * @param matchVal - the value that was matched in the original object to cause this match-patch to be applied
 * @returns the patch object with each function object replaced with its result
 */
function applyPatchFuncs( wholeObj:Obj_ish, patch: Obj_ish, matchVal: Val_ish  ): Obj_ish {
  const mtchs = [] as unknown[]
  function digForFuncs(obj: Obj_ish, parentObj?: Obj_ish, parentKey?: string) {
    Object.entries(obj).forEach(([key, val]) => {
      if (key==='__patchFunc') {
        const [patchFunc, jsonParams] = parseStrFuncAndJsonParams(val as string) as [PatchFunc|null, unknown]
        if (patchFunc && parentObj && parentKey) {
          const copyVal = `{${Object.entries(parentObj[parentKey])[0].join(': ')}}`
          parentObj[parentKey] = patchFunc(matchVal, jsonParams, wholeObj)
          mtchs.push(`${patchFunc.name}(${jsonParams}) / parentObj[${parentKey}]=${copyVal} / parentObj[${parentKey}]=${parentObj[parentKey]}`)
        }
      }
      else if (isObject(val)) digForFuncs(val as Obj_ish, obj, key)
    })
  }
  digForFuncs(patch) 
  if (mtchs.length) console.log(mtchs)
  return patch // for chaining if useful
}

export default function patchify(obj: Obj_ish, matchesToPatch: Patch[] = []): Obj_ish {
  const objCopy = JSON.parse(JSON.stringify(obj)) //=
  for (const { match, patch } of [...patchify.defaultPatches, ...matchesToPatch]) {
    console.log(patch)
    console.log(match)

    // const [matchObj,  matchKey,      matchVal] = findObjMatch(obj, match)
    // const [matchObj, matchParent2, matchKey2] = getMatchParentKey(obj, match)
    const matchObj = getMatch(obj, match)

    console.log(!!matchObj, matchObj, '||')
    // console.log(matchObj[matchKey], '||')
    // console.log(JSON.stringify(matchObj)+'||'+matchObj+'\n')
    if (matchObj) { 
      console.log(patch)
      const patchWFuncVals = applyPatchFuncs(obj, patch, matchObj) //= matchObj
      console.log(patchWFuncVals)
      // obj = merge(patchWFuncVals, objCopy) as Obj_ish // merge the original back on top of the patch
      obj = _.defaultsDeep(objCopy, patchWFuncVals ) as Obj_ish // merge each patch without stomping on existing values
      console.log(obj)
    }
  }
  return obj //=
}

patchify.defaultPatches = [] as Patch[]
patchify.addPatch = (patch_s_: (Patch|Patch[])) => { 
  if (Array.isArray(patch_s_)) return patch_s_.forEach(patchify.addPatch)
  else patchify.defaultPatches.push(patch_s_)
}

patchify.patchFuncs     = {} as PatchFuncsByName
patchify.addPatchFunc = ( patchFnByFnNm: (PatchFuncByName_NotEmpty) ) => {
  Object.assign(patchify.patchFuncs, patchFnByFnNm) //= patchFnByFnNm
}


// TESTS =============================================================================================================
console.log(isObject({ a: 1, b: 2 })); // true
console.log(isObject([])); // false
console.log(isObject('abc')); // false
console.log(isObject(null)); // false
console.log(isObject(undefined)); // false
console.log(isObject(123)); // false

const a = {a:888, b:{u:222,v:7}            } as Obj_ish
const b = {a:8,                 c:{p:1,q:1}} as Obj_ish
const c = {       b:{u:2}                  } as Obj_ish

const jj = ((obj) => JSON.parse(JSON.stringify(obj))) as (obj: Obj_ish) => Obj_ish

console.log(merge(jj(a), jj(b), jj(c))       ) //= 
console.log(merge(c,b,a)                   ) //= 


function yay_it(val: Val_ish, funcParams: Obj_ish) : (Obj_ish | Val_ish[] | Val_ish) {
  return `YAY! ${JSON.stringify(funcParams)}  val was: ${JSON.stringify(val)}`
}

function curly_vars_first(val: Val_ish, funcParams: Obj_ish) : (Obj_ish | Val_ish[] | Val_ish) {
  return (curly_vars_to_array(val, funcParams)?.[0] || '') as string //=
}
function curly_vars_to_array(val: Val_ish, funcParams: Obj_ish) : (Obj_ish | Val_ish[] | Val_ish) {
  console.log(typeof val,val) //=
  if (typeof val === 'string') {
    const matches = val.matchAll(/{\s*([a-zA-Z0-9_]+)\s*}/g)
    return [...matches].map(m => m[1]) //=
  }
  return []
}

function get_val(...args:PatchFuncArgs) : PatchFuncRet {
  const [_val, funcParams, wholeObj] = args
  console.log(funcParams) 
  console.log(wholeObj)
  const val = _get(wholeObj, funcParams)
  if (val === undefined) throw new Error(`get_val( ${funcParams} ) not found in ${JSON.stringify(wholeObj)}`)
  return val //=
}

function matches(...args:PatchFuncArgs) : PatchFuncRet {
  const [val, funcParams, _wholeObj] = args
  console.log(funcParams)
  const regexp = new RegExp(funcParams as string, 'g')
  if (!regexp) return [] as Val_ish[]
  const matches = (val as string).matchAll(regexp) 
  return [...matches].map(m => m[1]) //=
}

patchify.addPatchFunc( { 
  yay_it, 
  curly_vars_to_array,
  curly_vars_first,
  get_val,
  matches,
} )
patchify.addPatchFunc( { } )

patchify.patchFuncs //=

  
  patchify.addPatch([
    { "match": "llm.model_name:/text-davinci/", 
      "patch": {"llm":{"_type": "openai"}}
    },
    { match: 'prompt.template', // if obj.prompt.template exists
      patch: {input_key: { __patchFunc:'curly_vars_first()' }}, // then obj.input_key = the first string in curly vars in obj.prompt.template
    },
    // { match: 'prompt.template',
    //   patch: {aaa: { __patchFunc:'matches(\{([a-zA-Z0-9]+)\})' }},
    // },
    { match: 'prompt.template', // the value of  prompt.template  will be passed to the __patchFunc
      patch: {prompt:{
        //output_parser: null,
        //template_format: 'f-string',
        //_type: 'prompt',
        input_variables: { __patchFunc:'curly_vars_to_array()' },
        //tester: { __patchFunc:'yay_it({"foo":"boo"})' },
      }},
    },
    { match: 'llm._type:openai', 
      patch: {
        llm:{ aaa: { __patchFunc:'get_val(llm.override)' } }
      }
    },

])

//patchify.addPatch([
  // { match: {llm:{_type: 'openai'} }, 
  //   patch: {llm:{
  //     // test__matches: { __patchFunc:'matches("\\{([a-zA-Z0-9]+)\\}")'},
  //     temperature: 0.0, // max_tokens: 256, top_p: 1, frequency_penalty: 0, 
  //   // presence_penalty: 0, n: 1, best_of: 1, request_timeout: null, logit_bias: {},
  // }},
  // { match: {}, 
  //   patch: {memory: null, verbose: false, output_key: 'answer', llm:{model_name: "text-davinci-003"}}
  // },
  //])

patchify(
  { llm: {
      model_name: "text-davinci-003",
      override: 'AAA!',
    },
    prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
  }
) //= 
// patchify(
//   { 
//     prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
//   }
// ) //=
