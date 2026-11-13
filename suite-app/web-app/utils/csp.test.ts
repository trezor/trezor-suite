import { formatContentSecurityPolicy } from './csp';
import { getSecurityHeaders } from '../constants/webSecurityHeaders';

describe('WebAssembly content security policy', () => {
    it('quotes the WebAssembly keyword as a source expression', () => {
        expect(formatContentSecurityPolicy({ 'script-src': ['self', 'wasm-unsafe-eval'] })).toBe(
            "script-src 'self' 'wasm-unsafe-eval'",
        );
    });

    it('allows Cardano WebAssembly without allowing JavaScript string evaluation', () => {
        const directives = getSecurityHeaders()['content-security-policy'].split('; ');

        expect(directives.find(directive => directive.startsWith('script-src '))).toBe(
            "script-src 'self' 'wasm-unsafe-eval'",
        );
        expect(directives).toContain("script-src-attr 'none'");
        expect(directives).toContain("object-src 'none'");
        expect(directives).toContain("base-uri 'none'");
    });
});
