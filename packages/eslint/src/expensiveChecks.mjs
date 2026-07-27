// Some ESLint checks have substantial runtime overhead.
// Enable them only when a linting environment explicitly opts in.
export const areExpensiveChecksEnabled = process.env.ESLINT_RUN_EXPENSIVE_CHECKS === 'true';
