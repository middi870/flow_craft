// nodes/outputNode.js — uses BaseNode abstraction
import { BaseNode } from './BaseNode';

export const OutputNode = (props) => (
  <BaseNode
    {...props}
    title="Output"
    icon="■"
    color="#34d399"
    typeTag="I/O"
    fields={[
      {
        key: 'outputName',
        label: 'Output Name',
        type: 'text',
        default: props.id?.replace('customOutput-', 'output_') ?? 'output_1',
        placeholder: 'e.g. result',
      },
      {
        key: 'outputType',
        label: 'Output Type',
        type: 'select',
        default: 'Text',
        options: ['Text', 'Image', 'File', 'JSON', 'Number'],
      },
    ]}
    handles={{
      targets: [{ id: 'value', label: 'Input' }],
      sources: [],
    }}
  />
);
