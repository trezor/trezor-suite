import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type Account, type FormState } from '@suite-common/wallet-types';
import { type DefinitionsChannel } from '@trezor/connect-common';
import { asGetter } from '@trezor/dependency-injection';

import {
    type EnhancePrecomposedTransactionThunkDeps,
    type EnhancePrecomposedTransactionThunkState,
    enhancePrecomposedTransactionThunk,
} from './sendFormThunks';

const TOKEN_CONTRACT = '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const TOKEN_FILE = 'chain-id/1/token-a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.dat';

const account = {
    symbol: 'eth',
    networkType: 'ethereum',
    key: 'eth-account',
} as unknown as Account;
const formState = { outputs: [] } as unknown as FormState;
const precomposedTransaction = {
    type: 'final',
    token: { contract: TOKEN_CONTRACT },
    outputs: [],
} as any;

const enhance = (
    definitionsChannel: DefinitionsChannel | undefined,
    firmwareVersion: [number, number, number],
) => {
    const [major_version, minor_version, patch_version] = firmwareVersion;
    const { store } = createTestCompositionRoot<
        EnhancePrecomposedTransactionThunkDeps,
        EnhancePrecomposedTransactionThunkState
    >({
        preloadedState: {
            device: {
                selectedDevice: mockSuiteDevice(undefined, {
                    major_version,
                    minor_version,
                    patch_version,
                }),
            },
        } as EnhancePrecomposedTransactionThunkState,
        services: () => ({ getDebugSettings: asGetter(() => ({ definitionsChannel })) }),
    }).services;

    return store
        .dispatch(
            enhancePrecomposedTransactionThunk({
                transactionFormValues: formState,
                precomposedTransaction,
                selectedAccount: account,
            }),
        )
        .unwrap();
};

describe('enhancePrecomposedTransactionThunk', () => {
    let fetchMock: jest.SpyInstance;

    beforeEach(() => {
        fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
    });

    afterEach(() => jest.restoreAllMocks());

    it.each<[DefinitionsChannel | undefined, [number, number, number], string]>([
        [undefined, [2, 12, 0], `https://data.trezor.io/firmware/definitions/eth/${TOKEN_FILE}`],
        [
            'production',
            [2, 13, 0],
            `https://data.trezor.io/firmware/definitions/v2/eth/${TOKEN_FILE}`,
        ],
        [
            'development',
            [2, 13, 0],
            `https://dev.firmware.sldev.cz/definitions/v2/eth/${TOKEN_FILE}`,
        ],
        [
            'development',
            [1, 14, 1],
            `https://dev.firmware.sldev.cz/definitions/v1/eth/${TOKEN_FILE}`,
        ],
    ])(
        'checks the token definition on the %s channel for firmware %j',
        async (channel, firmwareVersion, url) => {
            await enhance(channel, firmwareVersion);

            expect(fetchMock).toHaveBeenCalledWith(url, { method: 'HEAD' });
        },
    );
});
