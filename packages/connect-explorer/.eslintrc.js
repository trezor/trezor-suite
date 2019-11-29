module.exports = {
    extends: '../../.eslintrc.js',
    rules: {
        // these are not needed for project that serves only docs purposes
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/heading-has-content': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/label-has-for': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        
        // these might be nice to refactor but, meh..
        'react/no-did-update-set-state': 'warn',
        'default-case': 'warn',
        'radix': 'warn',
        'no-restricted-globals': 'warn',
        'no-case-declarations': 'warn',
        'react/no-array-index-key': 'warn',
        'react/jsx-no-bind': 'warn',
        '@typescript-eslint/no-use-before-define': 'warn',
        'no-prototype-builtins': 'warn',
    }
};
