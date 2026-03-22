// nodes/inputNode.js — uses BaseNode abstraction
import { BaseNode } from './BaseNode';

export const InputNode = (props) => (
  <BaseNode
    {...props}
    title="Input"
    icon="▶"
    color="#22d3ee"
    typeTag="I/O"
    fields={[
      {
        key: 'inputName',
        label: 'Variable Name',
        type: 'text',
        default: props.id?.replace('customInput-', 'input_') ?? 'input_1',
        placeholder: 'e.g. user_query',
      },
      {
        key: 'inputType',
        label: 'Input Type',
        type: 'select',
        default: 'Text',
        options: ['Text', 'File', 'Number', 'JSON', 'Boolean'],
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        default: '',
        placeholder: 'Optional description…',
      },
    ]}
    handles={{
      targets: [],
      sources: [{ id: 'value', label: 'Output' }],
    }}
  />
);
