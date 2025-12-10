/**
 * Main App Component - Demo of Circuit Mapping System
 */

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import FlowWidget from './components/FlowWidget';
import { SAMPLE_RECORDS, SAMPLE_DOCUMENTS } from './data/sampleData';
import 'reactflow/dist/style.css';
import './App.css';

function App() {
  return (
    <ReactFlowProvider>
      <div className="app-container">
        <FlowWidget
          records={SAMPLE_RECORDS}
          documents={SAMPLE_DOCUMENTS}
          enableSearch={true}
          enableMiniMap={true}
          layoutDirection="LR"
          autoLayoutOnExpand={true}
          onNodeSelect={(nodeId, nodeData) => {
            console.log('Selected node:', nodeId, nodeData);
          }}
        />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
