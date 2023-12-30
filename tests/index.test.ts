import { addCorePatchFuncs } from '../src/core_PatchFuncs'
import { patchify } from '../src/patchify'

describe('index.ts langchain example', () => {
  it('should have default funcs', () => {
    expect(patchify.patchFuncs).toHaveProperty('get_val')
    expect(patchify.patchFuncs).toHaveProperty('matches')
    expect(patchify.patchFuncs).toHaveProperty('curly_vars_to_array')
    expect(patchify.patchFuncs).toHaveProperty('curly_vars_first')
  })
  it('should apply a long list of langchain related matches and patches', () => {
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
    var result = patchify(
      { llm: {
          model_name: "text-davinci-003",
          override: 'AAA!',
        },
        prompt:{template:'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}' }
      }
    )
    expect(result).toHaveProperty('llm')
    expect(result).toHaveProperty('prompt')
    expect(result).toHaveProperty('prompt.template')
    expect(result).toHaveProperty('bbb')
    expect(result).toHaveProperty('ccc')
    expect(result.llm).toHaveProperty('_type')
    expect(result.llm).toHaveProperty('aaa')
    expect(result.prompt).toHaveProperty('input_variables')
    expect(result.prompt['input_variables']).toEqual(['q1', 'q2', 'q3'])
    expect(result['input_key']).toEqual('q1')
    expect(result.bbb).toEqual(['q1', 'q2', 'q3'])
    expect(result.ccc).toEqual(['q1', 'q2', 'q3'])

    expect(result).toEqual({
      llm: {
        model_name: 'text-davinci-003',
        override: 'AAA!',
        _type: 'openai',
        aaa: 'AAA!'
      },
      prompt: {
        template: 'Answer questions as table rows, Q1:{q1}, Q2:{q2}, Q3:{q3}',
        input_variables: [ 'q1', 'q2', 'q3' ]
      },
      input_key: 'q1',
      bbb: [ 'q1', 'q2', 'q3' ],
      ccc: [ 'q1', 'q2', 'q3' ]
    })
  })
})