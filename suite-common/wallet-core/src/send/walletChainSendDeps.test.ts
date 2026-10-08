import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

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
});
