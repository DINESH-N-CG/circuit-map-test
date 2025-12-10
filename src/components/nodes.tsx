/**
 * Custom React Flow Node Components
 * RecordNode and DocumentNode with proper handles and styling
 */

import React, { memo, useMemo } from 'react';
import {
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  useNodeId,
} from 'reactflow';
import { FlowNodeData } from '../types';

import './nodes.css';

// ==================== Record Node ====================

interface RecordNodeProps extends NodeProps<FlowNodeData> {}

export const RecordNode = memo(function RecordNode(props: RecordNodeProps) {
  const { data, selected } = props;
  const { setCenter } = useReactFlow();
  const nodeId = useNodeId();

  const handleClick = () => {
    if (nodeId) {
      // Center the view on this node (parent component will handle expand)
      setCenter(props.xPos || 0, props.yPos || 0, { zoom: 1, duration: 300 });
    }
  };

  return (
    <div
      className={`record-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      title={data.title}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-content">
        <div className="node-key">{data.recordKey}</div>
        <div className="node-title">{data.title}</div>
        {data.childCount && data.childCount > 0 && (
          <div className="node-badge">{data.childCount}</div>
        )}
        {data.isExpanded && (
          <div className="node-indicator expanded">◄ Expanded</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
});

// ==================== Document Node ====================

interface DocumentNodeProps extends NodeProps<FlowNodeData> {}

export const DocumentNode = memo(function DocumentNode(
  props: DocumentNodeProps
) {
  const { data, selected } = props;
  const { setCenter } = useReactFlow();
  const nodeId = useNodeId();

  const handleClick = () => {
    if (nodeId) {
      setCenter(props.xPos || 0, props.yPos || 0, { zoom: 1, duration: 300 });
    }
  };

  const versionList = useMemo(() => {
    return (data.versions || []).slice(0, 5);
  }, [data.versions]);

  const moreVersions = useMemo(() => {
    const total = data.versions?.length || 0;
    return total > 5 ? total - 5 : 0;
  }, [data.versions]);

  return (
    <div
      className={`document-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      title={data.title}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-content">
        <div className="node-key">{data.documentKey}</div>
        <div className="node-title">{data.title}</div>

        {versionList.length > 0 && (
          <div className="versions-section">
            <div className="versions-label">Versions:</div>
            <div className="versions-pills">
              {versionList.map((version) => (
                <span key={version.versionId} className="version-pill">
                  v{version.versionNumber}
                </span>
              ))}
              {moreVersions > 0 && (
                <span className="version-pill more">+{moreVersions}</span>
              )}
            </div>
          </div>
        )}

        {data.childCount && data.childCount > 0 && (
          <div className="node-badge">{data.childCount}</div>
        )}

        {data.isExpanded && (
          <div className="node-indicator expanded">◄ Expanded</div>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
});

// ==================== Document Version Node ====================

interface DocumentVersionNodeProps extends NodeProps<FlowNodeData> {}

export const DocumentVersionNode = memo(function DocumentVersionNode(
  props: DocumentVersionNodeProps
) {
  const { data, selected } = props;
  const { setCenter } = useReactFlow();
  const nodeId = useNodeId();

  const handleClick = () => {
    if (nodeId) {
      setCenter(props.xPos || 0, props.yPos || 0, { zoom: 1, duration: 300 });
    }
  };

  return (
    <div
      className={`version-node ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      title={`Version ${data.versionNumber || data.title}`}
    >
      <Handle type="target" position={Position.Left} />

      <div className="node-content">
        <div className="node-key">{data.documentKey}</div>
        <div className="node-title">v{data.versionNumber || data.title}</div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
});

// ==================== Node Selector ====================

export const nodeTypes = {
  record: RecordNode,
  document: DocumentNode,
  documentVersion: DocumentVersionNode,
};
