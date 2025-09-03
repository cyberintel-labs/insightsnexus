# Automatic Node Type Detection

## Overview

The Insight Nexus OSINT Investigation Graph Analysis Tool now includes automatic node type detection functionality. When creating new nodes, the system automatically analyzes the node label content and assigns the most appropriate node type based on pattern matching and validation rules.

## How It Works

### Detection Patterns

The system uses regular expressions and keyword matching to detect the following node types:

1. **IP Address** (`ip`)
   - Pattern: IPv4 format (x.x.x.x)
   - Example: `192.168.1.1`, `10.0.0.1`

2. **Email** (`email`)
   - Pattern: email@domain.com format
   - Example: `john.doe@example.com`, `user@company.org`

3. **Domain** (`address` - using address type for domains)
   - Pattern: domain.com format
   - Example: `example.com`, `google.com`

4. **Organization** (`organization`)
   - Pattern: company/organization indicators including LLC, Corp, C-Corp, S-Corp
   - Example: `Acme LLC`, `TechCorp`, `C-Corp Solutions`, `Microsoft Corporation`

5. **Database** (`database`)
   - Pattern: database-related keywords including SQL, NoSQL
   - Example: `MySQL Database`, `NoSQL Database`, `User Database`

6. **Person** (`person`)
   - Pattern: name patterns (first last, title patterns) - excludes organizations and databases
   - Example: `John Smith`, `Dr. Jane Doe`

7. **Username** (`username`)
   - Pattern: mix of uppercase/lowercase/numbers or lowercase with numbers
   - Example: `johnDoe123`, `user123`, `AdminUser`

8. **Address** (`address`)
   - Pattern: street address patterns
   - Example: `123 Main Street`, `456 Oak Avenue`

9. **Event** (`event`)
   - Pattern: event keywords
   - Example: `Security Conference`, `Annual Meeting`

10. **Geo** (`geo`)
    - Pattern: geographic location patterns
    - Example: `New York City`, `California State`

11. **Custom** (`custom`)
    - Fallback for unrecognized patterns

## Implementation Details

### Backend API

- **Endpoint**: `POST /detect-node-type`
- **Input**: `{"label": "string"}`
- **Output**: `{"nodeType": "string"}`

### Frontend Integration

- **Node Creation**: Automatic type detection when double-clicking to create new nodes
- **Transform Operations**: Automatic type detection for nodes created during OSINT operations using TransformBase class
- **Centralized Logic**: All transforms use TransformBase for consistent node creation and type detection
- **Fallback**: Uses 'custom' type if detection fails

### Files Modified

1. **`src/services/dataProcessing.ts`**
   - Added `detectNodeType()` function with regex patterns

2. **`src/routes/api.ts`**
   - Added `/detect-node-type` endpoint

3. **`src/js/main.js`**
   - Updated node creation to use automatic type detection
   - Added automatic node selection after creation to show properties

4. **`src/js/utils/nodeTypeDetection.js`**
   - Created utility functions for type detection

5. **`src/js/transforms/ipToLocation.js`**
   - Updated to use automatic type detection for created nodes
   - Fixed async/await syntax for proper type detection

6. **`src/js/nodePropertiesMenu.js`**
   - Updated fallback type from "default" to "custom" to match detection

7. **`src/index.html`**
   - Fixed IP option value from "IP" to "ip" for consistency

8. **`src/services/dataProcessing.ts`**
   - Improved organization detection to include LLC, Corp, C-Corp, S-Corp patterns
   - Enhanced username detection for mixed case and lowercase with numbers
   - Enhanced database detection to include SQL and NoSQL patterns
   - Reordered detection logic to prioritize organizations and databases over usernames and persons

9. **`src/js/utils/transformBase.js`**
   - Created TransformBase utility class for centralized node creation with automatic type detection
   - Provides consistent node creation pattern, edge creation, overlap prevention, and undo/redo integration

10. **`src/js/transforms/ipToLocation.js`**
    - Refactored to use TransformBase class, eliminating code duplication and ensuring automatic type detection
    - Converted from promise-based to async/await syntax for proper integration with TransformBase

11. **`src/js/transforms/whois.js`**
    - Refactored to use TransformBase class for consistent node creation and automatic type detection
    - Converted from promise-based to async/await syntax and simplified node creation logic

12. **`src/js/transforms/portScan.js`**
    - Refactored to use TransformBase class, eliminating duplicate node creation code
    - Converted from promise-based to async/await syntax for proper integration with automatic type detection

## Usage

### Creating Nodes

1. Double-click on empty space in the graph
2. Enter a node name
3. The system automatically detects and assigns the appropriate type
4. The node appears with the correct styling for its type

### API Testing

Test the detection with curl:

```bash
# Test IP address
curl -X POST http://localhost:3000/detect-node-type \
  -H "Content-Type: application/json" \
  -d '{"label": "192.168.1.1"}'

# Test email
curl -X POST http://localhost:3000/detect-node-type \
  -H "Content-Type: application/json" \
  -d '{"label": "john.doe@example.com"}'

# Test person name
curl -X POST http://localhost:3000/detect-node-type \
  -H "Content-Type: application/json" \
  -d '{"label": "John Smith"}'
```

## Benefits

1. **Improved User Experience**: No need to manually select node types
2. **Consistency**: Automatic type assignment ensures consistent categorization across all transforms
3. **Efficiency**: Faster node creation workflow with centralized logic
4. **Visual Clarity**: Nodes are immediately styled according to their type
5. **Fallback Safety**: Unknown patterns default to 'custom' type
6. **Code Reuse**: TransformBase class eliminates duplication and ensures maintainability
7. **Architectural Integrity**: Separation of concerns with centralized node creation logic

## Future Enhancements

- Machine learning-based detection for more complex patterns
- User training to improve detection accuracy
- Custom pattern definitions
- Batch type detection for multiple nodes
- Type confidence scoring
