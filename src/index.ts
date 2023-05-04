import _ from 'lodash'

// import {patchify} from './patchify'
  
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

// //patchify.addPatch([
//   // { match: {llm:{_type: 'openai'} }, 
//   //   patch: {llm:{
//   //     // test__matches: { __patchFunc:'matches("\\{([a-zA-Z0-9]+)\\}")'},
//   //     temperature: 0.0, // max_tokens: 256, top_p: 1, frequency_penalty: 0, 
//   //   // presence_penalty: 0, n: 1, best_of: 1, request_timeout: null, logit_bias: {},
//   // }},
//   // { match: {}, 
//   //   patch: {memory: null, verbose: false, output_key: 'answer', llm:{model_name: "text-davinci-003"}}
//   // },
//   //])

// patchify(
//   { llm: {
//       model_name: "text-davinci-003",
//       override: 'AAA!',
//     },
//     prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
//   }
// ) //= 


const mapKeysDeepOld = (obj, cb) =>
_.mapValues(
  _.mapKeys(obj, cb),
  val => (_.isObject(val) ? mapKeysDeepOld(val, cb) : val),
)

const mapKeysDeepOld2 = (obj, cb) =>(
  _.mapValues(
    _.mapKeys(obj, (value, key, obj) => {
      return _.isObject(value) ? value : cb(obj, key, value)
    }),
    val => (_.isObject(val) ? mapKeysDeepOld2(val, cb) : val)
  )
)


const mapKeysDeep = (obj, cb, parentObj = null, key = null) =>(
  _.isObject(obj)
    ? (_.isArray(obj)
        ? _.map(obj, (v, k) => mapKeysDeep(v, cb, obj, k))
        : _.fromPairs(_.map(_.toPairs(obj), ([k, v]) => [cb(obj, k, v), mapKeysDeep(v, cb, obj, k)]))
      )
    : obj
)

const mapValuesDeep = (obj, cb, parentObj = null, key = null) => {
  const dig = (v, k) => mapValuesDeep(v, cb, obj, k)
  return _.isObject(obj)
    ? (_.isArray(obj)
        ? _.map(      obj, dig)
        : _.mapValues(obj, dig)
      )
    : cb(parentObj, key, obj)
}

const testObj = { a: { c: 2 }, d:[{x:7},{y:8}] }
const c = _.cloneDeep
mapKeysDeep(  c(testObj), (obj, k, v) => k.toUpperCase()+(_.isObject(v)?'':v)) //=
mapValuesDeep(c(testObj), (obj, k, v) => ''+k.toUpperCase()+'=='+(v)) //=
mapValuesDeep(c(testObj), (obj, k, v) => `${JSON.stringify(obj)}.${k} == ${v}`) //=
