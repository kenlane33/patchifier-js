
export type Obj_ish = { [key: string]: unknown; };
export type Key_ish = string | number | null;
export type Val_ish = Exclude<any, object>;
// type Ary_ish = unknown[];
export type MatchRet = [(Obj_ish | null), (string | null), Val_ish];
export type Patch = { match: string; patch: Obj_ish; };
export type PatchFuncArgs = [val: Val_ish, funcParams: any, wholeObj: Obj_ish];
export type PatchFuncRet = (Obj_ish | Val_ish[] | Val_ish);
export type PatchFunc = (...args: PatchFuncArgs) => PatchFuncRet;
export type PatchFuncsByName = { [funcName: string]: PatchFunc; };
export type PatchFuncByName_NotEmpty = Record<string, PatchFunc> & PatchFuncsByName;export type ObjCallbackFn = (obj: Obj_ish, k?: Key_ish, v?: Val_ish) => any;

