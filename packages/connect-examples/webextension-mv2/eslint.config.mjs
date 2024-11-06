// Todo: figure out the better way, if this would be package, we would use "@trezor/eslint": "workspace:*" in package.json
import parentConfig from '../../../eslint.config.mjs';

export default [
    ...parentConfig,
    {
        ignores: ['**/vendor*/'],
    },
    {
        rules: {
            'no-underscore-dangle': 'off',
            camelcase: 'off',
        },
    },
];
