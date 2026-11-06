import { RuleTester } from 'eslint';

import { noUnlimitedDisableRule } from './rule';

// The tested directives disable nothing but this rule, so unused-directive reports would add to the
// expected errors.
const ruleTester = new RuleTester({ linterOptions: { reportUnusedDisableDirectives: 'off' } });

ruleTester.run('no-unlimited-disable', noUnlimitedDisableRule, {
    valid: [
        '// eslint-disable-next-line no-console\nconsole.log(1);',
        'console.log(1); // eslint-disable-line no-console',
        '/* eslint-disable no-console */\nconsole.log(1);\n/* eslint-enable */',
        '// eslint-disable-next-line no-console -- logs on purpose\nconsole.log(1);',
        // ESLint reads `eslint-disable` only from block comments, so this one disables nothing.
        '// eslint-disable\nconsole.log(1);',
    ],
    invalid: [
        {
            code: '// eslint-disable-next-line\nconsole.log(1);',
            errors: [
                { messageId: 'unlimitedDisable', data: { type: 'disable-next-line' }, line: 1 },
            ],
        },
        {
            code: '// eslint-disable-next-line -- logs on purpose\nconsole.log(1);',
            errors: [
                { messageId: 'unlimitedDisable', data: { type: 'disable-next-line' }, line: 1 },
            ],
        },
        {
            // The directive covers its own line, which must not hide the report about it.
            code: 'console.log(1); // eslint-disable-line',
            errors: [{ messageId: 'unlimitedDisable', data: { type: 'disable-line' }, line: 1 }],
        },
        {
            code: '/* eslint-disable */\nconsole.log(1);',
            errors: [{ messageId: 'unlimitedDisable', data: { type: 'disable' }, line: 1 }],
        },
    ],
});
