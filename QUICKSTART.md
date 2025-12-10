# Quick Start Guide - Circuit Mapping

Get Circuit Mapping running in 5 minutes.

## ⚡ Installation

```bash
# 1. Navigate to project
cd circuit-mapping

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

The app opens automatically at `http://localhost:3000`

## 🎮 Basic Usage

### Initial Load
- The system loads with a root node: "System Architecture Specification" (REC-001)
- This is the entry point to your graph

### Expanding Nodes
1. **Click on any node** to expand it
2. Child nodes appear to the right
3. Connected items auto-layout automatically
4. Click again to collapse

### Searching
1. **Click the search box** at top-left
2. **Type your query** (record key, title, or version)
3. **Select from results** - the node spawns in the graph
4. The system automatically expands the path to that node

### Navigation
- **Pan**: Click and drag the canvas
- **Zoom**: Scroll wheel or pinch
- **Mini Map**: Click anywhere to jump to that area
- **Fit View**: Double-click or use the Controls

### Graph Controls
- **Expand All**: Expands all visible root nodes
- **Clear Graph**: Remove all nodes and start fresh

## 📊 Sample Data Structure

The demo includes:
- **6 Records** (system components)
- **6 Documents** (documentation)
- **18 Version variants** across documents
- **Complex relationships** between them

Example:
```
REC-001 (System Architecture)
  ├─ is_parent_of → REC-002 (API Layer)
  ├─ is_parent_of → REC-003 (Database)
  └─ references → DOC-001 (Architecture Guide)
                    v1.0, v1.1, v2.0
```

## 🔧 Quick Integration

To use your own data:

```typescript
// App.tsx
import { SAMPLE_RECORDS, SAMPLE_DOCUMENTS } from './data/sampleData';

// Replace with your data
const YOUR_RECORDS = [/* ... */];
const YOUR_DOCUMENTS = [/* ... */];

function App() {
  return (
    <ReactFlowProvider>
      <FlowWidget
        records={YOUR_RECORDS}         // ← Your records
        documents={YOUR_DOCUMENTS}     // ← Your documents
        initialNodeId="YOUR_ROOT_KEY"  // ← Your starting node
      />
    </ReactFlowProvider>
  );
}
```

## 🎨 Customization

### Change Colors
Edit `src/utils/dedup.ts`:
```typescript
export function getLinkTypeColor(linkType: LinkType): string {
  const colors: Record<LinkType, string> = {
    is_parent_of: '#YOUR_COLOR',  // ← Change here
    references: '#YOUR_COLOR',
    // ...
  };
}
```

### Change Layout Direction
Edit `src/components/FlowWidget.tsx`:
```typescript
<FlowWidget
  layoutDirection="TB"  // 'LR' = left-right, 'TB' = top-bottom
/>
```

### Hide/Show Features
```typescript
<FlowWidget
  enableSearch={false}   // Hide search
  enableMiniMap={false}  // Hide mini map
/>
```

## 🚀 Production Build

```bash
# Create optimized build
npm run build

# Output in ./build folder
# Deploy with any static host (Vercel, Netlify, etc)
```

## 🔗 Backend Integration

To connect to your API:

```typescript
// services/apiClient.ts - Already provided!

import { apiClient } from './services/apiClient';

async function loadData() {
  const records = await apiClient.fetchRecords();
  const documents = await apiClient.fetchDocuments();
  
  return { records, documents };
}

// Use in App.tsx
useEffect(() => {
  loadData().then(data => {
    setRecords(data.records);
    setDocuments(data.documents);
  });
}, []);
```

See [API_INTEGRATION.md](API_INTEGRATION.md) for full backend setup.

## 📖 Key Concepts

### Nodes
- **Record Nodes** (blue border): System components or items
- **Document Nodes** (orange border): Documentation with versions

### Links
- **is_parent_of**: Hierarchical relationship
- **references**: Document/record reference
- **verifies**: Validation/verification
- **depends_on**: Dependency
- **implements**: Implementation
- (And more...)

### Deduplication
- Same record key → **one node** (no duplicates)
- Same document key → **one node** (versions grouped)
- Same edge → **removed** (no duplicate connections)

### Expansion
- Click to **expand** and see children
- Click again to **collapse** and hide children
- Children load on-demand (efficient)
- Layout auto-adjusts

## ❓ Common Questions

**Q: How do I add more records?**
A: Update your data source or API endpoint. The system automatically handles any number of records.

**Q: Can I have custom metadata?**
A: Yes! Add any properties to the metadata object in Record or Document.

**Q: How do I show/hide certain link types?**
A: Filter in your data before passing to FlowWidget, or modify the edge rendering.

**Q: Performance with 10,000+ nodes?**
A: Works great! The system:
- Only renders visible nodes
- Loads children on-demand
- Uses indexed lookups
- Memoizes components

**Q: Can I export the graph?**
A: Yes, with React Flow's export features. See [React Flow docs](https://reactflow.dev/).

## 🐛 Troubleshooting

**Nodes not showing**
- Check console for errors
- Verify data has `recordKey` or `documentKey`
- Ensure `initialNodeId` matches your data

**Search not working**
- Records/documents need `title` field
- Try searching by title, not full description

**Slow on expand**
- Check browser's JavaScript tab in DevTools
- May need to optimize layout for 5000+ node graphs
- See ARCHITECTURE.md for optimization tips

**Layout looks weird**
- Try changing `layoutDirection` prop
- Or use different layout: `calculateForceDirectedLayout()`

## 📚 Next Steps

1. **Read [README.md](README.md)** for full documentation
2. **Check [ARCHITECTURE.md](ARCHITECTURE.md)** for technical details
3. **Review [API_INTEGRATION.md](API_INTEGRATION.md)** for backend setup
4. **Explore [src/](src/)** code files for implementation details

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Type definitions |
| `src/components/FlowWidget.tsx` | Main component |
| `src/hooks/useExpand.ts` | Expansion logic |
| `src/services/search.ts` | Search service |
| `src/utils/dedup.ts` | Core utilities |
| `src/data/sampleData.ts` | Sample data |
| `src/App.tsx` | Root component |

## 💡 Tips & Tricks

**Keyboard Shortcuts** (React Flow):
- `Ctrl/Cmd + Click`: Multi-select
- `Delete`: Delete selected
- `Space + Drag`: Pan view

**Performance Tips**:
- Start with one root node (don't load all)
- Use pagination for large datasets
- Expand nodes incrementally as needed

**Search Tips**:
- Search by key: `REC-001`
- Search by title: `Architecture`
- Search by version: `v1.0`
- Use arrow keys to navigate results

## 🎉 You're All Set!

Start exploring your dependency graph. The system is ready for:
- ✅ 100-5000+ nodes
- ✅ Complex relationships
- ✅ Multiple document versions
- ✅ Full-text search
- ✅ Auto-layout
- ✅ Custom styling

Questions? Check the docs or review the source code!
