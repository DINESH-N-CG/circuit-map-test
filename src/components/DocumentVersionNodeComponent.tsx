import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './DocumentVersionNodeComponent.css';

interface DocumentVersionNodeData {
  title: string;
  version: string;
  documentKey: string;
}

export default function DocumentVersionNodeComponent(props: NodeProps<DocumentVersionNodeData>) {
  const { data, selected } = props;

  return (
    <div className={`doc-version-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="node-title">{data.title}</div>
        <div className="version-label">v{data.version}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
