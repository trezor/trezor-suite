import '@suite-common/test-utils/globalOverrides';

import { useForm } from 'react-hook-form';

import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { SendContext } from 'src/hooks/wallet/useSendForm';
import { initialAppState } from 'src/support/tests/__fixtures__/defaultAppState';
import { extraDependenciesDesktopMock } from 'src/support/tests/extraDependenciesDesktop.mock';
import { renderWithProviders } from 'src/support/tests/hooksHelper';

import { EthereumNonce } from './EthereumNonce';

const ethAccount = mockWalletAccount({ symbol: 'eth' }) as any;

type Props = { displayNonce?: string; confirmedNonce?: string };

const changeFeeLevelMock = jest.fn();

const Harness = ({ displayNonce, confirmedNonce }: Props) => {
    const methods = useForm<any>({ mode: 'onChange', defaultValues: { ethereumNonce: '' } });
    // Reading errors here subscribes this host to formState so it re-renders on validation changes.
    const { errors } = methods.formState;

    const value = {
        ...methods,
        formState: { ...methods.formState, errors },
        account: ethAccount,
        composeTransaction: jest.fn(),
        changeFeeLevel: changeFeeLevelMock,
        getDefaultValue: (fieldName: string) => methods.getValues(fieldName),
        feeInfo: {
            levels: [
                {
                    label: 'normal',
                    feePerUnit: '10',
                    maxFeePerGas: '10',
                    maxPriorityFeePerGas: '2',
                    feeLimit: '21000',
                    blocks: -1,
                },
            ],
            minFee: 1,
            maxFee: 100,
            blockHeight: 0,
            blockTime: 1,
        },
    } as any;

    return (
        <SendContext.Provider value={value}>
            <EthereumNonce
                displayNonce={displayNonce}
                confirmedNonce={confirmedNonce}
                onCancel={jest.fn()}
            />
        </SendContext.Provider>
    );
};

// Pending tx occupying nonce 6 (gas in Wei), the replacement target for the fee-bump button.
const pendingAtNonce6 = {
    type: 'sent',
    blockHeight: 0,
    ethereumSpecific: { nonce: 6, maxFeePerGas: '50000000000', maxPriorityFeePerGas: '5000000000' },
} as any;

const render = (props: Props) => {
    const store = configureMockStore({
        preloadedState: {
            ...initialAppState,
            wallet: {
                ...initialAppState.wallet,
                transactions: {
                    ...initialAppState.wallet.transactions,
                    transactions: { [ethAccount.key]: [pendingAtNonce6] },
                },
            },
        },
    });

    return renderWithProviders(
        store,
        extraDependenciesDesktopMock.services,
        <Harness {...props} />,
    );
};

const typeNonce = async (text: string) => {
    const input = screen.getByTestId('ethereum-nonce-input') as HTMLInputElement;
    await act(async () => {
        await userEvent.type(input, text);
    });
};

// Confirmed nonce 5 (txs 0..4 mined), next available 8 (pending 5,6,7).
const STATE: Props = { confirmedNonce: '5', displayNonce: '8' };

describe('EthereumNonce validation', () => {
    beforeEach(() => changeFeeLevelMock.mockClear());

    it('blocks a nonce below the confirmed nonce (nonce too low)', async () => {
        render(STATE);
        await typeNonce('2');

        expect(await screen.findByText(/already been confirmed/i)).toBeInTheDocument();
        expect(screen.queryByTestId('@send/ethereum-nonce-warning')).not.toBeInTheDocument();
    });

    it('warns about a gap when the nonce is above the next expected', async () => {
        render(STATE);
        await typeNonce('10');

        expect(screen.getByTestId('@send/ethereum-nonce-warning')).toHaveTextContent(
            /higher than the next expected/i,
        );
    });

    it('warns about a replacement when the nonce lands on a pending tx', async () => {
        render(STATE);
        await typeNonce('6');

        expect(screen.getByTestId('@send/ethereum-nonce-warning')).toHaveTextContent(
            /replaces a pending transaction/i,
        );
    });

    it('offers a fee-bump button only for a replacement and applies the bumped custom fee', async () => {
        render(STATE);

        // gap nonce -> no bump button (no replacement fee requirement)
        await typeNonce('10');
        expect(screen.queryByTestId('send/apply-nonce-fee-bump')).not.toBeInTheDocument();

        // replacement nonce -> bump button applies the (already-bumped) composed fee as custom
        await typeNonce('{backspace}{backspace}6');
        fireEvent.click(screen.getByTestId('send/apply-nonce-fee-bump'));

        expect(changeFeeLevelMock).toHaveBeenCalledWith('custom');

        // once applied the button is replaced by an info line naming the replaced nonce
        expect(screen.queryByTestId('send/apply-nonce-fee-bump')).not.toBeInTheDocument();
        expect(screen.getByTestId('@send/ethereum-nonce-replacement-info')).toHaveTextContent(
            /replace the pending transaction with nonce 6/i,
        );
    });

    it('restores the bump button when the nonce changes after applying', async () => {
        render(STATE);

        await typeNonce('6');
        fireEvent.click(screen.getByTestId('send/apply-nonce-fee-bump'));
        expect(screen.queryByTestId('send/apply-nonce-fee-bump')).not.toBeInTheDocument();

        // switch to another replacement nonce -> the previously-applied bump no longer applies
        await typeNonce('{backspace}7');
        expect(screen.getByTestId('send/apply-nonce-fee-bump')).toBeInTheDocument();
        expect(
            screen.queryByTestId('@send/ethereum-nonce-replacement-info'),
        ).not.toBeInTheDocument();
    });

    it('accepts the next expected nonce with no warning or error', async () => {
        render(STATE);
        await typeNonce('8');

        expect(screen.queryByTestId('@send/ethereum-nonce-warning')).not.toBeInTheDocument();
        expect(screen.queryByText(/already been confirmed/i)).not.toBeInTheDocument();
    });
});
