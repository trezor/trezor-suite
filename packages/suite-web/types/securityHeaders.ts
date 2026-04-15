export type ContentSecurityPolicyRules = {
    'default-src': string[];
    'script-src-attr': string[];
    'script-src': string[];
    'style-src': string[];
    'style-src-elem': string[];
    'img-src': string[];
    'connect-src': string[];
    'upgrade-insecure-requests': true;
    'report-uri': string;
    'report-to': string;
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
