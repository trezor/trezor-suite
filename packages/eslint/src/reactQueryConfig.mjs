import pluginQuery from '@tanstack/eslint-plugin-query';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/** @type {Config[]} */
export const reactQueryConfig = [
    // TanStack Query — enforces Query best practices (only fires on files using the Query API).
    // `flat/recommended-strict` extends `flat/recommended` with the more aggressive opinionated rules.
    ...pluginQuery.configs['flat/recommended-strict'],
];
