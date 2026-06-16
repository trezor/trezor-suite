import '@suite-common/test-utils/src/globalOverrides';

import { useForm } from 'react-hook-form';

import { fireEvent, screen, waitFor } from '@testing-library/react';

import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import TrezorConnect from '@trezor/connect';

import { SendContext } from 'src/hooks/wallet/useSendForm';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { EthereumOptions } from '../EthereumOptions';

// The real input renders a react-hook-form NumberInput; stub it so this suite isolates the
// EthereumOptions chip/edit behavior from the form-control internals.
jest.mock('../EthereumNonce', () => ({
    EthereumNonce: ({ onCancel }: { onCancel: () => void }) => (
        <div data-testid="ethereum-nonce-input">
            <button type="button" data-testid="send/cancel-ethereum-nonce" onClick={onCancel} />
        </div>
    ),
}));

const ethAccount = mockWalletAccount({ symbol: 'eth' }) as any;

const sentTx = (nonce: number) =>
    ({ type: 'sent', blockHeight: 100, ethereumSpecific: { nonce } }) as any;

// Provides a real react-hook-form control (EthereumOptions reads `options` via useWatch) plus the
// rest of the send-form context the component touches.
const Harness = ({ initialOptions = [] }: { initialOptions?: string[] }) => {
    const methods = useForm<any>({
        defaultValues: { options: initialOptions, ethereumNonce: '', outputs: [] },
    });

    const value = {
        ...methods,
        account: ethAccount,
        composeTransaction: jest.fn(),
        getDefaultValue: (_name: string, fallback: unknown) => fallback,
        toggleOption: (option: string) => {
            const current = methods.getValues('options') || [];
            methods.setValue(
                'options',
                current.includes(option)
                    ? current.filter((o: string) => o !== option)
                    : [...current, option],
            );
        },
    } as any;

    return (
        <SendContext.Provider value={value}>
            <EthereumOptions />
        </SendContext.Provider>
    );
};

const render = (initialOptions: string[] = []) => {
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
        <Harness initialOptions={initialOptions} />,
    );
};

describe('EthereumOptions nonce', () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '6' } },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('shows the resolved next nonce as a read-only chip by default', async () => {
        render();

        await waitFor(() =>
            expect(screen.getByTestId('@send/ethereum-nonce')).toHaveTextContent('6'),
        );
        expect(screen.queryByTestId('ethereum-nonce-input')).not.toBeInTheDocument();
    });

    it('shows the editable input when the ethereumNonce option is enabled', async () => {
        render(['ethereumNonce']);

        await waitFor(() => expect(screen.getByTestId('ethereum-nonce-input')).toBeInTheDocument());
        // The read-only chip is replaced by the input + cancel control.
        expect(screen.queryByTestId('@send/ethereum-nonce')).not.toBeInTheDocument();
        expect(screen.getByTestId('send/cancel-ethereum-nonce')).toBeInTheDocument();
    });

    it('cancels the override and restores the read-only nonce', async () => {
        render(['ethereumNonce']);

        await waitFor(() => expect(screen.getByTestId('ethereum-nonce-input')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('send/cancel-ethereum-nonce'));

        await waitFor(() => expect(screen.getByTestId('@send/ethereum-nonce')).toBeInTheDocument());
        expect(screen.queryByTestId('ethereum-nonce-input')).not.toBeInTheDocument();
    });
});
