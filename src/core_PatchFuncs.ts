import { get as _get } from 'lodash';
import { Obj_ish, Val_ish, PatchFuncArgs, PatchFuncRet } from './patchifierTypes';
import { patchify } from './patchify';

// //====== |||||| =====================================================================================
// function yay_it(val: Val_ish, funcParams: Obj_ish): (Obj_ish | Val_ish[] | Val_ish) {
//   return `YAY! ${JSON.stringify(funcParams)}  val was: ${JSON.stringify(val)}`;
// }
//====== |||||||||||||||| =====================================================================================
function curly_vars_first(val: Val_ish, funcParams: Obj_ish): string {
  const x = curly_vars_to_array(val, funcParams) || [null]
  return x[0]
}
//====== ||||||||||||||||||| =====================================================================================
function curly_vars_to_array(val: Val_ish, funcParams: Obj_ish): (Val_ish[]) {
  console.log(typeof val, val); //=
  if (typeof val === 'string') {
    const matches = val.matchAll(/{\s*([a-zA-Z0-9_]+)\s*}/g);
    return [...matches].map(m => m[1]); //=
  }
  return [];
}
/**
 * 
 * @param args: [val, funcParams, wholeObj], 
 *               val        - is the value of the "match"ed deeply found (via matching _.get() path like a.b.c) 
 *                            that cause this patch's PatchFunc to be run
 *               funcParams - is the JSON.parse of the "in-parens" part of the __patchFunc of the patch object 
 *                            The value of a _patchFunc is a string function as in: { _patchFunc: 'get_val("a.b[0]")' }
 *                            Examples of funcParams for get_val(): a.b, llm._type, prompt.template, etc.
 *              wholeObj    - is the whole object that was passed to patchify() ONLY to read from
 * @returns the value at the path specified by the funcParams
 */
function get_val(...args: PatchFuncArgs): PatchFuncRet {
  const [_val, funcParams, wholeObj] = args;
  const val = _get(wholeObj, funcParams as string); // Provide the correct type for funcParams
  if (val === undefined)
    throw new Error(`get_val( ${funcParams} ) not found in ${JSON.stringify(wholeObj)}`);
  return val; //=
}
/**
 * 
 * matches() is a PatchFunc that returns an array of strings that match the regexp in the funcParams
 * 
 * Examples of funcParams for matches(): 
 * /\"(.*)\"/, - matches double-quoted strings:          'Get these "a" "b" "c" s if you please.'
 * /\{(.*)\}/, - matches curly-braced strings:           'Get these {a} {b} {c} s if you please.'
 * /\[(.*)\]/, - matches square-bracketed strings:       'Get these [a] [b] [c] s if you please.'
 * /\{\{(.*)\}\}/, - matches double-curly-braced strings 'Get these {{a}} {{b}} {{c}} s if you please.'
 * Though technically initial & trailing slashes in these funcParams are optional, it's best to include them.
 * Beware the potential bug of trying to match forward slashes with your regexp while leaving off the enclosing slashes.
 * 
 * @param args: [val, funcParams, wholeObj], 
 *               val        - is the value of the "match"ed deeply found (via matching _.get() path like a.b.c) 
 *                            that cause this patch's PatchFunc to be run
 *               funcParams - is the JSON.parse of the "in-parens" part of the __patchFunc of the patch object 
 *                            The value of a _patchFunc is a string function as in: { _patchFunc: 'matches(/\"(.*)\"/)' }
 *               wholeObj   - is the whole object that was passed to patchify() ONLY to read from
 * @returns an array of strings that match the regexp in the funcParams
 */

function matches(...args: PatchFuncArgs): PatchFuncRet {
  const [val, funcParams0, _wholeObj] = args;
  const funcParams = (funcParams0 as string).replace(/^\/|\/$/g, '');
  const regexp = new RegExp(funcParams as string, 'g');
  if (!regexp)
    return [] as Val_ish[];
  const matches = (val as string).matchAll(regexp);
  return [...matches].map(m => m[1]); //=
}
//============= ||||||||||||||||| =====================================================================================
export function addCorePatchFuncs() {
  patchify.addPatchFunc({
    // yay_it,
    curly_vars_to_array,
    curly_vars_first,
    get_val,
    matches,
  })
}
