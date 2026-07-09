import { isCodesignBuild } from '@trezor/env-utils';

import { type WithSuiteSyncQuotaManagerState } from '../quotaManagerSelectors';
import {
    getQuotaManagerDefaultUrl,
    getQuotaManagerUrl,
    selectQuotaManagerCustomUrl,
    selectQuotaManagerUrl,
} from '../quotaManagerUrl';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

type CreateQuotaManagerStateParams = {
    baseUrl: string | null;
};

const createQuotaManagerState = ({
    baseUrl,
}: CreateQuotaManagerStateParams): WithSuiteSyncQuotaManagerState => ({
    suiteSyncQuotaManager: {
        baseUrl,
        enforceQuotaManager: false,
        ownersAllowance: [],
        registeredDevices: [],
    },
});

describe(getQuotaManagerDefaultUrl.name, () => {
    it.each([
        {
            isCodesignBuildEnabled: true,
            isTorEnabled: false,
            expectedUrl: 'https://suite-sync.trezor.io/quota-manager/',
        },
        {
            isCodesignBuildEnabled: false,
            isTorEnabled: false,
            expectedUrl: 'https://suite-sync-dev.suite.sldev.cz/quota-manager/',
        },
        {
            isCodesignBuildEnabled: true,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/quota-manager/',
        },
        {
            isCodesignBuildEnabled: false,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync-dev.suite.sldevz5tqu7uh4owm4gg5erbn3doap5rhilvkwtvdq7ihibfpzw2a5ad.onion/quota-manager/',
        },
    ])(
        'returns $expectedUrl for codesign=$isCodesignBuildEnabled and tor=$isTorEnabled',
        ({ isCodesignBuildEnabled, isTorEnabled, expectedUrl }) => {
            (isCodesignBuild as jest.Mock).mockReturnValue(isCodesignBuildEnabled);

            expect(getQuotaManagerDefaultUrl({ isTorEnabled })).toBe(expectedUrl);
        },
    );
});

describe(getQuotaManagerUrl.name, () => {
    it.each([
        {
            env: 'prod' as const,
            isTorEnabled: false,
            expectedUrl: 'https://suite-sync.trezor.io/quota-manager/',
        },
        {
            env: 'prod' as const,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/quota-manager/',
        },
        {
            env: 'dev' as const,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync-dev.suite.sldevz5tqu7uh4owm4gg5erbn3doap5rhilvkwtvdq7ihibfpzw2a5ad.onion/quota-manager/',
        },
        {
            env: 'local' as const,
            isTorEnabled: false,
            expectedUrl: 'http://127.0.0.1:4001/',
        },
        {
            env: 'local' as const,
            isTorEnabled: true,
            expectedUrl: 'http://127.0.0.1:4001/',
        },
    ])(
        'returns $expectedUrl for env=$env and tor=$isTorEnabled',
        ({ env, isTorEnabled, expectedUrl }) => {
            (isCodesignBuild as jest.Mock).mockReturnValue(false);

            expect(getQuotaManagerUrl({ env, isTorEnabled })).toBe(expectedUrl);
        },
    );
});

describe(selectQuotaManagerCustomUrl.name, () => {
    it.each([
        {
            description: 'null url',
            baseUrl: null,
            expectedUrl: null,
        },
        {
            description: 'empty url',
            baseUrl: '',
            expectedUrl: null,
        },
        {
            description: 'blank url',
            baseUrl: '   ',
            expectedUrl: null,
        },
        {
            description: 'custom url',
            baseUrl: 'http://localhost:4001/quota-manager/',
            expectedUrl: 'http://localhost:4001/quota-manager/',
        },
    ])('returns $expectedUrl for $description', ({ baseUrl, expectedUrl }) => {
        expect(selectQuotaManagerCustomUrl(createQuotaManagerState({ baseUrl }))).toBe(expectedUrl);
    });
});

describe(selectQuotaManagerUrl.name, () => {
    it('uses custom quota manager url when it is set', () => {
        expect(
            selectQuotaManagerUrl(
                createQuotaManagerState({ baseUrl: 'http://localhost:4001/quota-manager/' }),
                true,
            ),
        ).toBe('http://localhost:4001/quota-manager/');
    });

    it('uses default quota manager url when custom url is not set', () => {
        (isCodesignBuild as jest.Mock).mockReturnValue(false);

        expect(selectQuotaManagerUrl(createQuotaManagerState({ baseUrl: null }), false)).toBe(
            'https://suite-sync-dev.suite.sldev.cz/quota-manager/',
        );
    });
});
