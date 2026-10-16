import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { DefinitionsChannel } from '@trezor/connect-common';

import { confirmedNonces, ethAccount, evmTx } from './__fixtures__/evmFixtures';
import { type WalletChainSendDepsState, createWalletChainSendDeps } from './walletChainSendDeps';

const initDeps = (definitionsChannel?: DefinitionsChannel) => {
    const { store } = createTestCompositionRoot<void, WalletChainSendDepsState>({
        preloadedState: {
            device: {
                selectedDevice: mockSuiteDevice(undefined, {
                    major_version: 2,
                    minor_version: 13,
                    patch_version: 0,
                }),
            },
            wallet: {
                accounts: [ethAccount],
                transactions: {
                    transactions: {
                        [ethAccount.key]: [...confirmedNonces(3), evmTx(3, { confirmed: false })],
                    },
                },
                blockchain: { sol: { blockHash: 'known-hash', blockHeight: 42 } },
            },
        } as never,
    }).services;

    return createWalletChainSendDeps({
        dispatch: store.dispatch,
        getState: store.getState,
        getDefinitionsChannel: () => definitionsChannel,
    });
};

describe(createWalletChainSendDeps.name, () => {
    it('finds the wallet account a send account is, for its known transactions', () => {
        const deps = initDeps();

        expect(deps.getAccountTransactions(ethAccount)).toHaveLength(4);
        expect(
            deps.getAccountTransactions({ ...ethAccount, descriptor: '0xsomeone-else' }),
        ).toEqual([]);
    });

    it('gives Solana the latest block the wallet knows', () => {
        expect(initDeps().getSolanaBlockInfo(asNetworkSymbol('sol'))).toEqual({
            blockHash: 'known-hash',
            blockHeight: 42,
        });
    });

    describe('isEvmTokenDefinitionKnown', () => {
        const token = { chainId: 1, contract: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' };
        const tokenFile = 'chain-id/1/token-a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.dat';
        let fetchMock: jest.SpyInstance;

        beforeEach(() => {
            fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true } as Response);
        });

        afterEach(() => jest.restoreAllMocks());

        it.each<[DefinitionsChannel | undefined, string]>([
            [undefined, `https://data.trezor.io/firmware/definitions/v2/eth/${tokenFile}`],
            [
                'development',
                `https://dev.firmware.sldev.cz/definitions/unsigned/v2/eth/${tokenFile}`,
            ],
        ])(
            'probes the definitions Connect sends to the selected device on the %s channel',
            async (channel, url) => {
                await expect(initDeps(channel).isEvmTokenDefinitionKnown(token)).resolves.toBe(
                    true,
                );
                expect(fetchMock).toHaveBeenCalledWith(url, { method: 'HEAD' });
            },
        );
    });
});
