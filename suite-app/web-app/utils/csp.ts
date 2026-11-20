import {
    ContentSecurityPolicyKeyword,
    ContentSecurityPolicyRules,
    ContentSecurityPolicySource,
} from '../types/securityHeaders';

const keywords = new Set(
    Object.keys({
        none: true,
        self: true,
        'unsafe-inline': true,
        'unsafe-eval': true,
        'wasm-unsafe-eval': true,
        'trusted-types-eval': true,
        'unsafe-hashes': true,
        'strict-dynamic': true,
        'report-sample': true,
        'inline-speculation-rules': true,
    } satisfies Record<ContentSecurityPolicyKeyword, true>),
);

const nonceOrHashPattern = /^(?:nonce|sha256|sha384|sha512)-[\w+/-]+={0,2}$/;

function quoteDirectiveValue(value: ContentSecurityPolicySource) {
    return keywords.has(value) || nonceOrHashPattern.test(value) ? `'${value}'` : value;
}

export function formatContentSecurityPolicy<Rules extends Partial<ContentSecurityPolicyRules>>(
    rules: Rules,
) {
    return Object.entries(rules)
        .map(([key, value]) => {
            if (value === true) {
                return key;
            }

            if (Array.isArray(value)) {
                return `${key} ${value.map(quoteDirectiveValue).join(' ')}`;
            }

            return `${key} ${value}`;
        })
        .join('; ');
}
