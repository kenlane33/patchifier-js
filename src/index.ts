import {isObject} from 'lodash'
import { mapKeysDeep, mapValuesDeep } from './mapDeep'
import { Key_ish, Obj_ish, Val_ish } from './patchifierTypes'
import {patchify} from './patchify'

const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
mapKeysDeep(  (testObj), (obj:Obj_ish, k?:Key_ish, v?:Val_ish) => (k+'').toUpperCase()+(isObject(v)?'':v))    //=
mapKeysDeep(  (testObj), (obj:Obj_ish, k?:Key_ish, v?:Val_ish) => k+(isObject(v)?'':v+2))                //=
mapValuesDeep((testObj), (obj:Obj_ish, k?:Key_ish, v?:Val_ish) => (k+'').toUpperCase()+'=='+(v))           //=
mapValuesDeep((testObj), (obj:Obj_ish, k?:Key_ish, v?:Val_ish) => `${JSON.stringify(obj)}.${k} == ${v}`) //=



patchify.addPatch([
  { "match": "llm.model_name:/text-davinci-/", 
    "patch": {"llm":{"_type": "openai"}}
  },
  { match: 'prompt.template', // if obj.prompt.template exists
    patch: {input_key: { __patchFunc:'curly_vars_first()' }}, // then obj.input_key = the first string in curly vars in obj.prompt.template
  },
  { match: 'prompt.template',
    patch: {bbb: { __patchFunc:'matches(\{([a-zA-Z0-9]+)\})' }},
  },
  { match: 'prompt.template',
    patch: {ccc: { __patchFunc:'matches(/\{([a-zA-Z0-9]+)\}/)' }},
  },
  { match: 'prompt.template', // the value of  prompt.template  will be passed to the __patchFunc
    patch: {prompt:{
      //output_parser: null,
      //template_format: 'f-string',
      //_type: 'prompt',
      input_variables: { __patchFunc:'curly_vars_to_array()' },
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
var x = patchify(
  { llm: {
      model_name: "text-davinci-003",
      override: 'AAA!',
    },
    prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
  }
) 
console.log('=====index.ts=====\n', x)