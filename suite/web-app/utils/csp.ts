import { ContentSecurityPolicyRules } from '../types/securityHeaders';

const quotedDirectivesValues = new Set(['self', 'none', 'unsafe-inline', 'unsafe-eval']);

function quoteDirectiveValue(value: string) {
    return quotedDirectivesValues.has(value) ? `'${value}'` : value;
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
