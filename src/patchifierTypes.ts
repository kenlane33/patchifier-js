
export type Obj_ish = { [key: string]: unknown; };
export type Key_ish = string | number | null;
export type Val_ish = Exclude<any, object>;
// type Ary_ish = unknown[];

/*
  * A MatchRet is a tuple of the form [obj, key, val]
  */
export type MatchRet = [(Obj_ish | null), (string | null), Val_ish];

/* 
  * A Patch is a free-form object that will be merged in at the spot specified by a match and _might_ include a __patchFunc whose output replaces the matched value
  * @param match - is a string that is passed to _.get() to find the object to be patched
  * @param patch - is the object that will be merged in at the spot specified by match
  */
export type Patch = { match: string, patch: Obj_ish }

/* 
  * PatchFuncArgs is the type of the arguments passed to a PatchFunc
  * @param val        - is the value from the 
  * @param funcParams - is the JSON.parse of the "in-parens" part of the __patchFunc of the patch object 
  *                     The value of a _patchFunc is a string function as in: { _patchFunc: 'get_val("a.b[0]")' }
  *                     Examples of funcParams for get_val(): a.b, llm._type, prompt.template, etc.
  * @param wholeObj   - is the whole object that was passed to patchify() ONLY to read from
  * @param matchVal   - is the value of the "match"ed object part deeply found (via matching _.get() path like a.b.c) 
*/
export type PatchFuncArgs = [val: Val_ish, funcParams: any, wholeObj: Obj_ish, matchVal: Val_ish]

/*
  * PatchFuncRet is the type of the return value of a PatchFunc
  * Could be an object, an array, or a value
  */
export type PatchFuncRet = (Obj_ish | Val_ish[] | Val_ish);
/* 
  * A PatchFunc is a function that takes a value, a function parameter, and the whole object and returns a value
  * @param val        - is the value of the "match"ed deeply found (via matching _.get() path like a.b.c) 
  *                     that cause this patch's PatchFunc to be run
  * @param funcParams - is the JSON.parse of the "in-parens" part of the __patchFunc of the patch object 
  *                     The value of a _patchFunc is a string function as in: { _patchFunc: 'get_val("a.b[0]")' }
  *                     Examples of funcParams for get_val(): a.b, llm._type, prompt.template, etc.
  * @param wholeObj   - is the whole object that was passed to patchify() ONLY to read from
  * @returns the value at the path specified by the funcParams
  */
export type PatchFunc = (...args: PatchFuncArgs) => PatchFuncRet;

/*
  * PatchFuncsByName is a dictionary of PatchFuncs indexed by their name
  */
export type PatchFuncsByName = { [funcName: string]: PatchFunc }

/*
  * PatchFuncByName_NotEmpty is a dictionary of PatchFuncs indexed by their name
  * It is _not_ empty, so it can be used in place of PatchFuncsByName
  */
export type PatchFuncByName_NotEmpty = Record<string, PatchFunc> & PatchFuncsByName

/*
  * ObjCallbackFn is a function that will be called for each key-value while traversing via mapKeysDeep() or mapValuesDeep()
  * @param parObj - is the the parent of the current key & value
  * @param k      - is the current iterated key on parObj
  * @param v      - is the value of the object at parObj[k]
  * @returns the value at the path specified by the funcParams
  */
export type ObjCallbackFn = (parObj: Obj_ish, k?: Key_ish, v?: Val_ish) => any;

