import { checkSecurityViolation } from '../src/metroSecureResolver';

describe('checkSecurityViolation', () => {
    it('should detect violation when accessing @trezor scoped package from node_modules', () => {
        const result = checkSecurityViolation({
            moduleName: '@trezor/connect',
            originModulePath: 'path/to/node_modules/some-package/index.js',
        });

        expect(result.isViolation).toBe(true);
    });

    it('should detect violation when using relative path inside node_modules', () => {
        const result = checkSecurityViolation({
            moduleName: '../../@trezor/connect/src/utils',
            originModulePath: 'path/to/node_modules/external-lib/index.js',
        });

        expect(result.isViolation).toBe(true);
    });

    it('should detect violation when using relative path inside node_modules 2', () => {
        const result = checkSecurityViolation({
            moduleName: '../../../node_modules/@trezor/connect/src/utils',
            originModulePath: 'path/to/node_modules/external-lib/index.js',
        });

        expect(result.isViolation).toBe(true);
    });

    it('should detect violation when using relative path from node_modules', () => {
        const result = checkSecurityViolation({
            moduleName: '../../../packages/connect/src/utils',
            originModulePath: 'path/to/node_modules/external-lib/index.js',
        });

        expect(result.isViolation).toBe(true);
    });

    it('should detect violation when using crazy relative path from node_modules', () => {
        const result = checkSecurityViolation({
            moduleName: '../../scripts/../packages/connect/src/utils',
            originModulePath: 'path/to/node_modules/external-lib/index.js',
        });

        expect(result.isViolation).toBe(true);
    });

    it('should allow @trezor imports from non-node_modules location', () => {
        const result = checkSecurityViolation({
            moduleName: '@trezor/connect',
            originModulePath: 'path/to/src/components/index.ts',
        });

        expect(result.isViolation).toBe(false);
    });

    it('should allow relative imports from non-node_modules location', () => {
        const result = checkSecurityViolation({
            moduleName: '../utils',
            originModulePath: 'path/to/src/components/index.ts',
        });

        expect(result.isViolation).toBe(false);
    });

    it('should allow regular node_modules imports', () => {
        const result = checkSecurityViolation({
            moduleName: 'react',
            originModulePath: 'path/to/node_modules/some-package/index.js',
        });

        expect(result.isViolation).toBe(false);
    });
});
