import { merge, get as _get } from 'lodash'
import { getMatch } from './getMatch'

type Obj_ish = { [key: string]: unknown }
type Val_ish  = Exclude<unknown, object>
type Ary_ish  = unknown[]

type MatchRet = [(Obj_ish | null), (string | null), Val_ish]

type Patch     = {match: string, patch: Obj_ish}
type PatchFuncArgs = [val: Val_ish, funcParams: unknown, wholeObj: Obj_ish]
type PatchFuncRet  = (Obj_ish | Val_ish[] | Val_ish)
type PatchFunc = (...args: PatchFuncArgs) => PatchFuncRet
type PatchFuncsByName = { [funcName:string]:PatchFunc }
type PatchFuncByName_NotEmpty = Record<string, PatchFunc> & PatchFuncsByName

function findObjMatch(obj: Obj_ish, match: string): MatchRet {
  console.log(match)
  const matchObj = getMatch(obj, match) //= 
  if (matchObj==undefined) return [null, null, null]
  // grab everything before the :
  const pathArr = match.split(':')[0].split('.') //=
  const parPath = pathArr.slice(0, -1).join('.') //= 
  const lastKey = pathArr.slice(-1)[0] //=
  const parent  = getMatch(obj, parPath) 
  console.log(parent)
  return [obj as Obj_ish, lastKey, matchObj as Val_ish] //=
}

function findObjMatchOld(obj: Obj_ish, match: Obj_ish): MatchRet {
  const matchKeys = Object.keys(match)
  if (matchKeys.length === 0) return [obj, null, null] // lets you match an empty object to any object
  let matchKey = null
  let matchVal = null
  const matchObj = Object.entries(obj).find(([key, value]) => {
    if (matchKeys.includes(key)) {
      const valToMatch = match[key]
      if (typeof value === "object" && value !== null) {
        const [objMatch, objMatchKey, objMatchVal] = findObjMatchOld(value as Obj_ish, valToMatch as Obj_ish)
        if (objMatch) {
          matchKey = objMatchKey ? `${key}.${objMatchKey}` : key
          matchVal = objMatchVal
          return true
        }
      } else if (valToMatch === "*" || value === valToMatch) {
        matchKey = key
        matchVal = value
        return true
      }
    }
    return false
  });
  return matchObj ? [obj, matchKey, matchVal] : [null, null, null]; //=
}
function isObject(item: unknown): item is Obj_ish {
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
 * Looks for special keys called __patchFunc in the patch object, and replaces the value with the result of the function.
 * 
 * @param wholeObj 
 * @param patch 
 * @param matchVal 
 * @returns 
 */
function applyPatchFuncs( wholeObj:Obj_ish, patch: Obj_ish, matchVal: Val_ish  ): Obj_ish {
  const mtchs = [] as unknown[]
  function digForFuncs(obj: Obj_ish, parentObj?: Obj_ish, parentKey?: string) {
    Object.entries(obj).forEach(([key, val]) => {
      if (key==='__patchFunc') {
        const [func, jsonParams] = parseStrFuncAndJsonParams(val as string)
        if (func && parentObj && parentKey) { 
          parentObj[parentKey] = func(matchVal, jsonParams, wholeObj)
          mtchs.push([func, parentObj[parentKey], parentObj, parentKey, matchVal])
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
    const [matchObj,_matchKey,matchVal] = findObjMatch(obj, match) 
    console.log(!!matchObj, matchVal)
    console.log(JSON.stringify(matchObj)+'||'+matchVal+'\n')
    if (matchObj) { 
      const patchWFuncVals = applyPatchFuncs(obj, patch, matchVal) //= matchVal
      console.log(patch)
      console.log(patchWFuncVals)
      obj = merge(patchWFuncVals, objCopy) as Obj_ish 
      console.log(obj)
    }
  }
  return obj
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

function regexp_matches(...args:PatchFuncArgs) : PatchFuncRet {
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
  regexp_matches,
} )
patchify.addPatchFunc( { } )

patchify.patchFuncs //=

  
  patchify.addPatch([
    { "match": "llm.model_name:/text-davinci/", 
      "patch": {"llm":{"_type": "openai"}}
    },
  //   { match: 'prompt.template',
  //     patch: {input_key: { __patchFunc:'curly_vars_first()' }},
  //   },
  //   { match: 'prompt.template',
  //     patch: {aaa: { __patchFunc:'regexp_matches(\{([a-zA-Z0-9]+)\})' }},
  //   },
  //   { match: 'prompt.template', // the value of  prompt.template  will be passed to the __patchFunc
  //     patch: {prompt:{
  //       output_parser: null,
  //       template_format: 'f-string',
  //       _type: 'prompt',
  //       input_variables: { __patchFunc:'curly_vars_to_array()' },
  //       tester: { __patchFunc:'yay_it({"foo":"boo"})' },
  //   }},
  // },
  { match: 'llm._type:openai', 
    patch: {
      llm:{ _type: { __patchFunc:'get_val(llm.override)' } }
    }
  },

])

//patchify.addPatch([
  // { match: {llm:{_type: 'openai'} }, 
  //   patch: {llm:{
  //     test__get_val: { __patchFunc:'get_val("llm._type")'},
  //     // test__regexp_matches: { __patchFunc:'regexp_matches("\\{([a-zA-Z0-9]+)\\}")'},
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
      override: 'FOOP',
    },
    prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
  }
) //= 
// patchify(
//   { 
//     prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
//   }
// ) //=
