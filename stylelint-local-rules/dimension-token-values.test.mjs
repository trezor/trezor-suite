import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
// eslint-disable-next-line import/no-extraneous-dependencies
import postcssStyledSyntax from 'postcss-styled-syntax';
import stylelint from 'stylelint';

import plugin from './dimension-token-values.cjs';

const lint = async code => {
    const result = await stylelint.lint({
        code,
        codeFilename: 'component.tsx',
        config: {
            customSyntax: postcssStyledSyntax,
            plugins: [plugin],
            rules: {
                [plugin.ruleName]: true,
            },
        },
    });

    return result.results[0].warnings;
};

describe(plugin.ruleName, () => {
    for (const declaration of [
        'padding: 8px 12px;',
        'margin: -4px auto 0;',
        'margin: calc(var(--padding) * -1);',
        'gap: ${({ $gap }) => $gap}px;',
        'margin-top: calc((4px - 24px) / 2);',
        'border-radius: 12px 12px 0 0;',
        'border-radius: 50%;',
        'border-radius: calc(infinity * 1px);',
        'border: 2px solid red;',
        'outline-width: 4px;',
    ]) {
        it(`accepts ${declaration}`, async () => {
            assert.equal((await lint(`const Component = styled.div\`${declaration}\`;`)).length, 0);
        });
    }

    for (const [declaration, value, tokenType] of [
        ['padding: 7px;', '7px', 'spacing'],
        ['gap: 1rem;', '1rem', 'spacing'],
        ['padding: -4px;', '-4px', 'spacing'],
        ['border-radius: 2px;', '2px', 'border-radius'],
        ['border-radius: 14px;', '14px', 'border-radius'],
        ['border: 3px solid red;', '3px', 'border-width'],
        ['outline-width: 1.5px;', '1.5px', 'border-width'],
    ]) {
        it(`rejects ${declaration}`, async () => {
            const warnings = await lint(`const Component = styled.div\`${declaration}\`;`);

            assert.equal(warnings.length, 1);
            assert.match(warnings[0].text, new RegExp(`Unexpected value "${value}"`));
            assert.match(warnings[0].text, new RegExp(`${tokenType} token`));
        });
    }
});
