/**
 * @link https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
 */
export type ContentSecurityPolicyKeyword =
    | 'none'
    | 'self'
    | 'unsafe-inline'
    | 'unsafe-eval'
    | 'wasm-unsafe-eval'
    | 'trusted-types-eval'
    | 'unsafe-hashes'
    | 'strict-dynamic'
    | 'report-sample'
    | 'inline-speculation-rules';

type ContentSecurityPolicyHashAlgorithm = 'sha256' | 'sha384' | 'sha512';

/**
 * Keywords, nonces and hashes are written without quotes, `formatContentSecurityPolicy` adds them.
 * Any other source must be a scheme or a host with a dot, because the policy reads a bare word,
 * such as a misspelled or unlisted keyword, as a host name and silently ignores its meaning.
 */
export type ContentSecurityPolicySource =
    | ContentSecurityPolicyKeyword
    | `nonce-${string}`
    | `${ContentSecurityPolicyHashAlgorithm}-${string}`
    | '*'
    | `${string}:${string}`
    | `${string}.${string}`;

export type ContentSecurityPolicyRules = {
    'default-src': ContentSecurityPolicySource[];
    'script-src-attr': ContentSecurityPolicySource[];
    'script-src': ContentSecurityPolicySource[];
    'style-src': ContentSecurityPolicySource[];
    'style-src-elem': ContentSecurityPolicySource[];
    'img-src': ContentSecurityPolicySource[];
    'connect-src': ContentSecurityPolicySource[];
    'upgrade-insecure-requests': true;
    'report-uri': string;
    'report-to': string;
    'form-action': ContentSecurityPolicySource[];
    'frame-ancestors': ContentSecurityPolicySource[];
    'base-uri': ContentSecurityPolicySource[];
    'object-src': ContentSecurityPolicySource[];
    'frame-src': ContentSecurityPolicySource[];
};

/**
 * Allow only stricter values from available options
 */
export type SecurityHeaders = {
    'strict-transport-security': string;
    'upgrade-insecure-requests': '1';
    'x-content-type-options': 'nosniff';
    'x-frame-options': 'SAMEORIGIN' | 'DENY';
    'permissions-policy': string;
    'referrer-policy':
        | 'strict-origin-when-cross-origin'
        | 'no-referrer'
        | 'no-referrer-when-downgrade'
        | 'same-origin'
        | 'strict-origin';
    'cross-origin-opener-policy': 'same-origin';
    'content-security-policy': ContentSecurityPolicyRules;
    'report-to': string;
    'reporting-endpoints': string;
};
