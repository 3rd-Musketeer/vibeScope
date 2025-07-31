# Code Philosophy

This document outlines the coding philosophy and style preferences for this project.

## Core Philosophy

**KISS (Keep It Simple, Stupid)** - Simplicity over cleverness. Code should be readable, maintainable, and straightforward.

**Functional Programming Approach** - Favor pure functions, immutable data, and functional composition over complex object hierarchies.

**Fail Fast** - Immediate feedback on errors. No silent failures, no error codes. Clear, contextual error messages.

## Code Style Guidelines

### 1. Comments
- **Minimal comments** - Code should be self-documenting
- **Only TODO/deprecation comments** for backward compatibility notes
- No explanatory comments - let the code speak for itself

### 2. Type Hints
- **Function signatures only** - Parameters and return types
- **No variable type annotations** for cleaner code
- Clear, descriptive type hints that enhance readability

### 3. Error Handling
- **Fail fast with context** - Immediate exceptions with helpful messages
- **No silent failures** or cryptic error codes
- Provide actionable error information

### 4. Async/Await Strategy
- **Async for I/O operations** - Network calls, file operations, database queries
- **Sync for CPU operations** - Calculations, data transformations
- **Use `asyncio.to_thread()`** when calling sync work from async context

### 5. Import Organization
- Standard library → blank line → Third party → blank line → Local imports
- Clear separation and logical grouping

### 6. Naming Conventions
- **snake_case everywhere** - Consistent naming throughout
- **Descriptive names** - Function and variable names should clearly indicate purpose
- Avoid abbreviations and unclear naming

### 7. Architecture Principles
- **Pure functions** over classes when possible
- **Single responsibility** - Each function does one thing well
- **Functional composition** over complex inheritance
- **Flat file structure** - Prefer simple organization over deep hierarchies

### 8. Code Organization
- **Extract → Transform → Load** patterns for data processing
- **No unnecessary abstractions** - Don't over-engineer
- **Composable functions** that work well together
- **Stateless when possible** - Easier to test and reason about

## Development Approach

**MVP Mindset** - Build the simplest thing that works, then iterate
**Test-Driven Thinking** - Write code that's easy to test in isolation
**Backward Compatibility** - Maintain compatibility during refactors when possible
**Clear Separation of Concerns** - Each module should have a clear, focused purpose

## Code Quality Metrics

- **Readability** - Code should read like well-written prose
- **Testability** - Functions should be easy to test in isolation  
- **Maintainability** - Changes should be easy to make without breaking other parts
- **Performance** - Simple, efficient solutions over premature optimization