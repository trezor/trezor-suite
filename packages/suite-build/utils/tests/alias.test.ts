import { prepareAliases, resolvePath } from '../alias';

describe('prepare aliases for webpack from TS config aliases', () => {
    it('convert whole paths sets ', () => {
        const paths = {
            '@suite-components/*': ['./packages/suite/src/components/suite/*'],
            '@suite-components': ['./packages/suite/src/components/suite/index'],
            '@desktop/*': ['./packages/suite-desktop/src/*'],
            '@desktop-electron/*': ['./packages/suite-desktop/src-electron/*'],
            '@trezor/utils': ['./packages/utils/src'],
        };
        const result = {
            '@suite-components': resolvePath('./packages/suite/src/components/suite'),
            '@desktop': resolvePath('./packages/suite-desktop/src'),
            '@desktop-electron': resolvePath('./packages/suite-desktop/src-electron'),
            '@trezor/utils': resolvePath('./packages/utils/src'),
        };

        expect(prepareAliases(paths)).toEqual(result);
    });

    it('deduplicate aliases paths with wildcard correctly', () => {
        const paths = {
            '@suite-components/*': ['./packages/suite/src/components/suite/*'],
            '@suite-components': ['./packages/suite/src/components/suite/index'],
        };

        const result = {
            '@suite-components': resolvePath('./packages/suite/src/components/suite'),
        };

        expect(prepareAliases(paths)).toEqual(result);
    });
});
