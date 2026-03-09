# Strict Coding Standards

This skill focuses on codebase quality and maintainability.

## Best Practices

- **TypeScript**: Mandatory for all new components. Use interfaces and types
  for all props.
- **Linting**: No ESLint warnings allowed in production-ready branches.
- **Formatting**: Auto-format with Prettier before every commit.
- **Documentation**: All public functions and complex logic must be documented
  with JSDoc.

## Code Review Focus

- **DRY**: Don't Repeat Yourself; extract reusable components.
- **Performance**: Use `useMemo`, `useCallback`, and `FlatList` for large lists.
- **Security**: Sanitize all user inputs before processing.
