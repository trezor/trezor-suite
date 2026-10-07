import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect from '@trezor/connect';

import { confirmedNonces, ethAccount, evmTx } from './__fixtures__/evmFixtures';
import { type WalletChainSendDepsState, createWalletChainSendDeps } from './walletChainSendDeps';

const initDeps = () => {
    const { store } = createTestCompositionRoot<void, WalletChainSendDepsState>({
        preloadedState: {
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

    return createWalletChainSendDeps({ dispatch: store.dispatch, getState: store.getState });
};

describe(createWalletChainSendDeps.name, () => {
    afterEach(() => jest.restoreAllMocks());

    it('finds the wallet account a send account is, for its own pending sends', () => {
        const deps = initDeps();

        expect(deps.getEvmPrivatePendingHint(ethAccount)).toMatchObject({ nonces: [3] });
        expect(
            deps.getEvmPrivatePendingHint({ ...ethAccount, descriptor: '0xsomeone-else' }),
        ).toBeUndefined();
    });

    it('resolves the nonce from the backend and the transactions the wallet knows', async () => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { confirmedNonce: '3' } },
        } as any);

        await expect(
            initDeps().resolveEvmNonce({ account: ethAccount, fetchConfirmedNonce: true }),
        ).resolves.toEqual({ nonce: '4', confirmedNonce: '3' });
    });

    it('refuses to resolve a nonce for an account the wallet does not have', () => {
        expect(() =>
            initDeps().resolveEvmNonce({
                account: { ...ethAccount, descriptor: '0xsomeone-else' },
                fetchConfirmedNonce: true,
            }),
        ).toThrow('Account not found.');
    });

    it('gives Solana the latest block the wallet knows', () => {
        expect(initDeps().getSolanaBlockInfo(asNetworkSymbol('sol'))).toEqual({
            blockHash: 'known-hash',
            blockHeight: 42,
        });
    });
});
