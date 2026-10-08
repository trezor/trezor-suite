import '@suite-common/test-utils/globalOverrides';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createFakeChainNetwork } from '@suite-common/chain-data/mocks/createFakeChainNetwork';
import { createStaticChainNetworksStore } from '@suite-common/chain-data/mocks/createStaticChainNetworksStore';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type PrecomposedTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { RuntimeEvmNetworkDefinition } from '@trezor/network-ethereum-suite-common';

import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { RuntimeChainSendModal } from './RuntimeChainSendModal';
import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const RECIPIENT = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

const definition: RuntimeEvmNetworkDefinition = {
    symbol: asNetworkSymbol('abc'),
    chainId: 777,
    name: 'Example Chain',
    nativeSymbol: 'EXC',
    decimals: 18,
    rpcUrls: ['https://rpc.example.com'],
    source: 'user',
};

const walletAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const feeInfo = {
    blockHeight: 1,
    blockTime: 12,
    minFee: 0,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [],
};

const finalLevel = {
    type: 'final',
    fee: '21000000000000',
    feePerByte: '1',
    feeLimit: '21000',
    totalSpent: '500021000000000000',
    max: '0.999979',
    outputs: [],
} as unknown as PrecomposedTransaction;

const renderModal = () => {
    const runtime = createFakeChainNetwork({
        symbol: definition.symbol,
        nativeSymbol: definition.nativeSymbol,
        balances: { [walletAccount.descriptor]: '1' },
        rate: null,
        canSend: true,
        feeInfo,
    });
    runtime.send.composeFeeLevels.mockResolvedValue({ normal: finalLevel, high: finalLevel });

    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });
    const onComposed = jest.fn();
    const onCancel = jest.fn();

    renderWithProviders(
        { ...services, chainNetworksStore: createStaticChainNetworksStore([runtime.network]) },
        <RuntimeChainSendModal
            definition={definition}
            walletAccount={walletAccount}
            onComposed={onComposed}
            onCancel={onCancel}
        />,
    );

    return { runtime, onComposed };
};

describe(RuntimeChainSendModal.name, () => {
    it("composes a send of the network's coin and hands it over to sign", async () => {
        const { runtime, onComposed } = renderModal();
        const user = userEvent.setup();

        await user.type(
            screen.getByTestId('@runtime-chain-send/recipient'),
            RECIPIENT.toLowerCase(),
        );
        await user.type(screen.getByTestId('@runtime-chain-send/amount'), '0.5');

        await waitFor(() =>
            expect(screen.getByTestId('@runtime-chain-send/fee')).toHaveTextContent(
                'Max fee: 0.000021 EXC',
            ),
        );
        expect(runtime.send.composeFeeLevels).toHaveBeenLastCalledWith(
            expect.objectContaining({
                account: expect.objectContaining({
                    symbol: 'abc',
                    descriptor: walletAccount.descriptor,
                    availableBalance: '1000000000000000000',
                }),
                draft: expect.objectContaining({
                    outputs: [expect.objectContaining({ address: RECIPIENT, amount: '0.5' })],
                    selectedFee: 'normal',
                }),
                context: { feeInfo },
            }),
        );

        await user.click(screen.getByTestId('@runtime-chain-send/continue'));

        expect(onComposed).toHaveBeenCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    outputs: [expect.objectContaining({ address: RECIPIENT, amount: '0.5' })],
                }),
                precomposedTransaction: finalLevel,
            }),
        );
    });

    it('refuses an address with a wrong checksum before composing', async () => {
        const { runtime } = renderModal();

        await userEvent.type(
            screen.getByTestId('@runtime-chain-send/recipient'),
            RECIPIENT.replace('a', 'A'),
        );

        expect(screen.getByText(/checksum does not match/)).toBeInTheDocument();
        expect(runtime.send.composeFeeLevels).not.toHaveBeenCalled();
    });
});
