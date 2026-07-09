import { isCodesignBuild } from '@trezor/env-utils';

import { type WithSuiteSyncState } from '../../suiteSyncSlice';
import {
    getSuiteSyncDefaultRelayUrl,
    getSuiteSyncRelayUrl,
    selectSuiteSyncRelayUrl,
} from '../relayUrl';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isCodesignBuild: jest.fn(),
}));

type CreateSuiteSyncStateParams = {
    suiteSyncRelayUrl: string | null;
};

const createSuiteSyncState = ({
    suiteSyncRelayUrl,
}: CreateSuiteSyncStateParams): WithSuiteSyncState => ({
    suiteSync: {
        relayConnectionStatuses: [],
        settings: {
            isSuiteSyncDebugEnabled: false,
            isSuiteSyncEnabled: false,
            suiteSyncRelayUrl,
        },
        suiteSyncErrors: {},
        suiteSyncOwners: {},
    },
});

describe(getSuiteSyncDefaultRelayUrl.name, () => {
    it.each([
        {
            isCodesignBuildEnabled: true,
            isTorEnabled: false,
            expectedUrl: 'https://suite-sync.trezor.io/evolu/',
        },
        {
            isCodesignBuildEnabled: false,
            isTorEnabled: false,
            expectedUrl: 'https://suite-sync-dev.suite.sldev.cz/evolu/',
        },
        {
            isCodesignBuildEnabled: true,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/evolu/',
        },
        {
            isCodesignBuildEnabled: false,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync-dev.suite.sldevz5tqu7uh4owm4gg5erbn3doap5rhilvkwtvdq7ihibfpzw2a5ad.onion/evolu/',
        },
    ])(
        'returns $expectedUrl for codesign=$isCodesignBuildEnabled and tor=$isTorEnabled',
        ({ isCodesignBuildEnabled, isTorEnabled, expectedUrl }) => {
            (isCodesignBuild as jest.Mock).mockReturnValue(isCodesignBuildEnabled);

            expect(getSuiteSyncDefaultRelayUrl({ isTorEnabled })).toBe(expectedUrl);
        },
    );
});

describe(getSuiteSyncRelayUrl.name, () => {
    it.each([
        {
            env: 'prod' as const,
            isTorEnabled: false,
            expectedUrl: 'https://suite-sync.trezor.io/evolu/',
        },
        {
            env: 'prod' as const,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion/evolu/',
        },
        {
            env: 'dev' as const,
            isTorEnabled: true,
            expectedUrl:
                'http://suite-sync-dev.suite.sldevz5tqu7uh4owm4gg5erbn3doap5rhilvkwtvdq7ihibfpzw2a5ad.onion/evolu/',
        },
        {
            env: 'local' as const,
            isTorEnabled: false,
            expectedUrl: 'http://127.0.0.1:4000/evolu/',
        },
        {
            env: 'local' as const,
            isTorEnabled: true,
            expectedUrl: 'http://127.0.0.1:4000/evolu/',
        },
    ])(
        'returns $expectedUrl for env=$env and tor=$isTorEnabled',
        ({ env, isTorEnabled, expectedUrl }) => {
            (isCodesignBuild as jest.Mock).mockReturnValue(false);

            expect(getSuiteSyncRelayUrl({ env, isTorEnabled })).toBe(expectedUrl);
        },
    );
});

describe(selectSuiteSyncRelayUrl.name, () => {
    it('uses custom relay url when it is set', () => {
        expect(
            selectSuiteSyncRelayUrl(
                createSuiteSyncState({ suiteSyncRelayUrl: 'http://localhost:4000/evolu/' }),
                true,
            ),
        ).toBe('http://localhost:4000/evolu/');
    });

    it('uses default relay url when custom url is not set', () => {
        (isCodesignBuild as jest.Mock).mockReturnValue(false);

        expect(
            selectSuiteSyncRelayUrl(createSuiteSyncState({ suiteSyncRelayUrl: null }), false),
        ).toBe('https://suite-sync-dev.suite.sldev.cz/evolu/');
    });
});
