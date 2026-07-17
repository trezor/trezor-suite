// eslint-disable-next-line import/no-extraneous-dependencies
const valueParser = require('postcss-value-parser');
const stylelint = require('stylelint');

const ruleName = 'trezor/dimension-token-values';

const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected: (value, property, tokenType) =>
        `Unexpected value "${value}" for "${property}"; use a ${tokenType} token`,
});

const spacingValues = new Set([
    0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 128, 160,
]);
const borderRadiusValues = new Set([0, 4, 6, 8, 10, 12, 16, 20, 24, 32]);
const borderWidthValues = new Set([0, 1, 2, 4]);

const spacingPropertyPattern = /^(?:gap|row-gap|column-gap|padding|margin)(?:-.+)?$/;
const borderRadiusPropertyPattern = /^border(?:-.+)?-radius$/;
const borderWidthPropertyPattern =
    /^(?:border|outline|border-width|outline-width|border-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?(?:-width)?)$/;
const numericValuePattern = /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i;

const maskInterpolations = value => {
    let result = '';
    let index = 0;

    while (index < value.length) {
        if (value[index] !== '$' || value[index + 1] !== '{') {
            result += value[index];
            index++;
            continue;
        }

        let depth = 1;
        index += 2;

        while (index < value.length && depth > 0) {
            if (value[index] === '{') depth++;
            if (value[index] === '}') depth--;
            index++;
        }

        result += '__styled_interpolation__';
    }

    return result;
};

const getTokenConfig = property => {
    if (spacingPropertyPattern.test(property)) {
        return {
            allowedValues: spacingValues,
            tokenType: 'spacing',
            allowNegative: property.startsWith('margin'),
        };
    }

    if (borderRadiusPropertyPattern.test(property)) {
        return {
            allowedValues: borderRadiusValues,
            tokenType: 'border-radius',
            allowNegative: false,
        };
    }

    if (borderWidthPropertyPattern.test(property)) {
        return {
            allowedValues: borderWidthValues,
            tokenType: 'border-width',
            allowNegative: false,
        };
    }

    return null;
};

const ruleFunction = primary => (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
        actual: primary,
        possible: [true],
    });

    if (!validOptions) return;

    root.walkDecls(declaration => {
        const property = declaration.prop.toLowerCase();
        const tokenConfig = getTokenConfig(property);

        if (tokenConfig === null) return;

        const value = maskInterpolations(declaration.value);
        const normalizedValue = value.replaceAll(/\s+/g, '').toLowerCase();

        if (tokenConfig.tokenType === 'border-radius' && normalizedValue === 'calc(infinity*1px)') {
            return;
        }

        valueParser(value).walk(node => {
            if (node.type !== 'word') return;

            const match = node.value.match(numericValuePattern);
            if (match === null) return;

            const numericValue = Number(match[1]);
            const unit = match[2].toLowerCase();

            if (unit === '%') return;
            if (unit === '') return;
            if (unit !== 'px') {
                stylelint.utils.report({
                    result,
                    ruleName,
                    message: messages.rejected(node.value, property, tokenConfig.tokenType),
                    node: declaration,
                    word: node.value,
                });

                return;
            }

            const absoluteValue = Math.abs(numericValue);
            const isAllowed =
                tokenConfig.allowedValues.has(absoluteValue) &&
                (numericValue >= 0 || tokenConfig.allowNegative);

            if (!isAllowed) {
                stylelint.utils.report({
                    result,
                    ruleName,
                    message: messages.rejected(node.value, property, tokenConfig.tokenType),
                    node: declaration,
                    word: node.value,
                });
            }
        });
    });
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

module.exports = stylelint.createPlugin(ruleName, ruleFunction);
module.exports.ruleName = ruleName;
module.exports.messages = messages;
