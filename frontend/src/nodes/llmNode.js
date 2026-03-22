// nodes/llmNode.js — uses BaseNode abstraction
import { BaseNode } from './BaseNode';

export const LLMNode = (props) => (
  <BaseNode
    {...props}
    title="LLM"
    icon="◈"
    color="#a78bfa"
    typeTag="AI"
    fields={[
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        default: 'llama3.2',
        options: [
          'llama3.2', 'llama3', 'mistral', 'codellama',
          'llama2', 'phi3', 'gemma', 'mixtral',
          'gpt-4o', 'gpt-4-turbo', 'claude-3-sonnet',
        ],
      },
      {
        key: 'systemPrompt',
        label: 'System Prompt',
        type: 'textarea',
        default: 'You are a helpful assistant.',
        placeholder: 'Define AI behaviour…',
        rows: 3,
      },
      {
        key: 'temperature',
        label: 'Temperature',
        type: 'number',
        default: '0.7',
        min: 0, max: 2, step: 0.1,
      },
      {
        key: 'maxTokens',
        label: 'Max Tokens',
        type: 'number',
        default: '1000',
        min: 1,
      },
    ]}
    handles={{
      targets: [
        { id: 'system', label: 'System',  top: '33%' },
        { id: 'prompt', label: 'Prompt',  top: '66%' },
      ],
      sources: [
        { id: 'response', label: 'Response' },
      ],
    }}
  />
);
