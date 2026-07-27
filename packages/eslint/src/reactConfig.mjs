import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

import { areExpensiveChecksEnabled } from './expensiveChecks.mjs';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/** @type {Config[]} */
export const reactConfig = [
    // React
    pluginReact.configs.flat.recommended,
    {
        languageOptions: pluginReact.configs.flat.recommended.languageOptions,
        settings: { react: { version: 'detect' } },
        rules: {
            // Additions
            'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
            'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],

            // Offs
            'react/react-in-jsx-scope': 'off', // We are not importing React in every file
            'react/prop-types': 'off', // This rule is not needed when using TypeScript
            'react/display-name': 'off', // This is annoying for stuff like `forwardRef`. Todo: reconsider
        },
    },

    // React Hooks
    pluginReactHooks.configs.flat.recommended,
    {
        plugins: { 'react-hooks': pluginReactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': ['error', { additionalHooks: '(useAsyncMemo)' }],
            'react-hooks/static-components': 'off', // TODO fix & reenable
            'react-hooks/set-state-in-effect': 'off', // TODO fix & reenable, though this anti-pattern is unfortunately quite widespread
            'react-hooks/refs': 'off', // Too restrictive. Reading ref in render is often desired, though must be carefully considered
            'react-hooks/use-memo': 'off', // Too restrictive: enforces inline function in useMemo (forbids using variable)
        },
    },
    ...(areExpensiveChecksEnabled
        ? []
        : [
              {
                  rules: {
                      'react-hooks/preserve-manual-memoization': 'off',
                      'react-hooks/incompatible-library': 'off',
                      'react-hooks/immutability': 'off',
                      'react-hooks/globals': 'off',
                      'react-hooks/error-boundaries': 'off',
                      'react-hooks/purity': 'off',
                      'react-hooks/set-state-in-render': 'off',
                      'react-hooks/unsupported-syntax': 'off',
                      'react-hooks/config': 'off',
                      'react-hooks/gating': 'off',
                  },
              },
          ]),
];
