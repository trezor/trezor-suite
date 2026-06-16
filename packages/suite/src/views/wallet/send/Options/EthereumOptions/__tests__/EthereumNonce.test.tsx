import '@suite-common/test-utils/src/globalOverrides';

import { screen, waitFor } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { SendContext } from 'src/hooks/wallet/useSendForm';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { EthereumNonce } from '../EthereumNonce';

jest.mock('@suite/intl', () => ({
    ...jest.requireActual('@suite/intl'),
    Translation: ({ id }: { id: string }) => <span data-testid={id}>{id}</span>,
}));

const ethAccount = mockWalletAccount({ symbol: 'eth' }) as any;

const sentTx = (nonce: number) =>
    ({ type: 'sent', blockHeight: 100, ethereumSpecific: { nonce } }) as any;

const sendContextValue = {
    account: ethAccount,
    composeTransaction: jest.fn(),
    control: {} as any,
    formState: { errors: {} },
} as any;

const render = () => {
    const store = configureMockStore({
        preloadedState: {
            ...initialAppState,
            wallet: {
                ...initialAppState.wallet,
                transactions: {
                    ...initialAppState.wallet.transactions,
                    // confirmed nonces 0..5 -> resolved nonce 6
                    transactions: {
                        [ethAccount.key]: Array.from({ length: 6 }, (_, i) => sentTx(i)),
                    },
                },
            },
        },
    });

    return renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <SendContext.Provider value={sendContextValue}>
            <EthereumNonce />
        </SendContext.Provider>,
    );
};

describe('EthereumNonce', () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '6' } },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('shows the resolved nonce in the send-form options', async () => {
        render();

        await waitFor(() => expect(screen.getByText('6')).toBeInTheDocument());
    });
});
