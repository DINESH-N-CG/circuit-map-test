import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import './RecordNodeComponent.css';

interface RecordNodeData {
  title: string;
  key: string;
}

export default function RecordNodeComponent(props: NodeProps<RecordNodeData>) {
  const { data, selected } = props;

  return (
    <div className={`record-like-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        <div className="node-key">{data.key}</div>
        <div className="node-title">{data.title}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
