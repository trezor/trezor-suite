import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

export const reactConfig = [
    // React
    pluginReact.configs.flat.recommended,
    {
        languageOptions: {
            ...pluginReact.configs.flat.recommended.languageOptions,
        },
        settings: { react: { version: 'detect' } },
        rules: {
            // Additions
            'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
            'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],

            // Offs
            'react/react-in-jsx-scope': 'off', // We are not importing React in every file
            'react/prop-types': 'off', // This rule is not needed when using TypeScript
            'react/display-name': 'off', // This is annoying for stuff like `forwardRef`. Todo: reconsider
            'no-prototype-builtins': 'off', // Todo: just temporary, reconsider to remove it
        },
    },

    // React Hooks
    {
        plugins: { 'react-hooks': pluginReactHooks },
        rules: {
            ...pluginReactHooks.configs.recommended.rules,
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
        },
    },
];
