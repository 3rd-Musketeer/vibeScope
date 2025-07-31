# Frontend Code Cleanup & Refactoring Plan

## Overview
After the server refactoring and UI redesign, clean up legacy code, remove unused components, and enhance code clarity by removing redundant functionality that's no longer needed.

## Analysis of Current State

### **Legacy Components to Remove**
1. **Chat System Components** (replaced by QueryInterface):
   - `src/components/chat/chat-interface.tsx` - Complete chat component (no longer used)
   - `src/hooks/use-chat.ts` - Chat-related hooks (replaced by use-query.ts)
   - `useChatStore` in `src/lib/store.ts` - Chat state management (unused)

2. **Sidebar & Stats Components** (removed from layout):
   - `src/components/layout/left-sidebar.tsx` - Left sidebar wrapper (unused)
   - `src/components/charts/charts-sidebar.tsx` - ECharts visualization (unused)
   - `src/components/project/stats-cards.tsx` - Header stats cards (removed from layout)

### **Legacy API Methods to Clean**
3. **Deprecated API Endpoints**:
   - `sendChatMessage()` in `src/lib/api.ts` - Old chat endpoint (replaced by queryProject)
   - `searchTasks()` in `src/lib/api.ts` - Non-functional search endpoint
   - Legacy export methods if not needed

### **Unused Type Definitions**
4. **Type Cleanup**:
   - `ChatMessage` interface in `src/lib/types.ts` (no longer used)
   - `sidebarCollapsed` in `DashboardStore` (no sidebar to collapse)
   - Legacy schema types if not needed for backward compatibility

### **Dependencies to Remove**
5. **Package Cleanup**:
   - `echarts-for-react` - Only used in removed charts component
   - Any other unused chart/visualization dependencies

## Detailed Cleanup Tasks

### 1. Remove Chat System Components
**Files to Delete**:
- `src/components/chat/chat-interface.tsx` - 148 lines of unused chat UI
- `src/hooks/use-chat.ts` - Chat hooks and state management

**Files to Update**:
- `src/lib/store.ts` - Remove `useChatStore` and `ChatStore` interface
- `src/lib/types.ts` - Remove `ChatMessage` interface

### 2. Remove Sidebar & Charts Components  
**Files to Delete**:
- `src/components/layout/left-sidebar.tsx` - Left sidebar wrapper
- `src/components/charts/charts-sidebar.tsx` - ECharts visualization component
- `src/components/project/stats-cards.tsx` - Header stats display

**Directory to Remove**:
- `src/components/chat/` - Entire chat directory
- `src/components/charts/` - Entire charts directory

### 3. Clean Up API Methods
**File to Update**: `src/lib/api.ts`
- Remove `sendChatMessage()` method (lines 91-113)
- Remove `searchTasks()` method (lines 115-131) - non-functional search
- Clean up related imports if any

### 4. Simplify State Management
**File to Update**: `src/lib/store.ts`
- Remove `sidebarCollapsed` and `toggleSidebar()` from `DashboardStore`
- Remove `useChatStore` completely
- Clean up imports (`ChatMessage` type)

**File to Update**: `src/lib/types.ts`
- Remove `ChatMessage` interface
- Remove `sidebarCollapsed` and `toggleSidebar` from `DashboardStore`
- Consider removing legacy schema types if not needed for backward compatibility

### 5. Package Dependencies Cleanup
**File to Update**: `package.json`
- Remove `echarts-for-react` dependency
- Remove `echarts` if it was a separate dependency
- Run `npm audit` to check for other unused dependencies

### 6. Import Statement Cleanup
**Files to Check and Update**:
- Any remaining imports of deleted components
- Update import statements that reference removed types
- Clean up unused import statements throughout the codebase

## Code Quality Improvements

### 7. Enhance Type Safety
- Replace any remaining `any` types with proper TypeScript interfaces
- Ensure all API responses have proper type definitions
- Add proper error types for better error handling

### 8. Improve Code Organization
- Consolidate related functionality
- Ensure consistent naming conventions
- Add proper JSDoc comments where helpful
- Remove commented-out code blocks

### 9. Performance Optimizations
- Remove unused imports and dependencies
- Optimize bundle size by removing dead code
- Ensure proper tree-shaking of unused exports

## Expected Benefits

### **Code Quality**
- **Reduced Complexity**: Remove ~400+ lines of unused code
- **Better Maintainability**: Cleaner codebase focused on current functionality
- **Type Safety**: Eliminate unused type definitions and improve remaining ones

### **Performance**
- **Smaller Bundle**: Remove echarts and chat dependencies
- **Faster Build**: Less code to compile and type-check
- **Reduced Memory**: Fewer components and state management

### **Developer Experience**
- **Clearer Architecture**: Focus on QueryInterface vs Chat confusion
- **Easier Navigation**: Fewer unused files to navigate through
- **Consistent Patterns**: Single approach for AI interaction (queries vs chat)

## Files Summary

**Files to Delete (8)**:
- `src/components/chat/chat-interface.tsx`
- `src/hooks/use-chat.ts`
- `src/components/layout/left-sidebar.tsx`
- `src/components/charts/charts-sidebar.tsx`
- `src/components/project/stats-cards.tsx`

**Files to Update (4)**:
- `src/lib/store.ts` - Remove chat store and sidebar state
- `src/lib/types.ts` - Remove chat types and unused store properties
- `src/lib/api.ts` - Remove deprecated API methods
- `package.json` - Remove unused dependencies

**Directories to Remove (2)**:
- `src/components/chat/`
- `src/components/charts/`

This cleanup will result in a leaner, more focused codebase that aligns with the new RAG-based query system and streamlined UI design.