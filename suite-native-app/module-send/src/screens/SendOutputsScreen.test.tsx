import { type PropsWithChildren } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { type FeeLevelLabel, type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { SendStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { SendOutputsScreen } from './SendOutputsScreen';
import { useSendForm } from '../hooks/useSendForm';
import { getSendFeeStatus } from '../utils';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: jest.fn(),
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    Screen: ({ children }: PropsWithChildren) => children,
}));
jest.mock('@suite-native/accounts', () => ({ AccountDetailsCard: () => null }));
jest.mock('@suite-native/forms', () => ({
    ...jest.requireActual('@suite-native/forms'),
    Form: ({ children }: PropsWithChildren) => children,
}));
jest.mock('../components/AccountBalanceScreenHeader', () => ({
    AccountBalanceScreenHeader: () => null,
}));
jest.mock('../components/SendOutputFields', () => ({ SendOutputFields: () => null }));
jest.mock('../components/SendFeeSection', () => ({ SendFeeSection: () => null }));
jest.mock('../hooks/useSendForm');
jest.mock('../hooks/useShowDeviceDisconnectedAlert', () => ({
    useShowDeviceDisconnectedAlert: () => jest.fn(),
}));
jest.mock('../hooks/useUtxoSelection', () => ({
    useUtxoSelection: () => ({ totalSelectedAmount: 0, selectedUtxos: [] }),
}));

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const finalTransaction: GeneralPrecomposedTransaction = {
    type: 'final',
    totalSpent: '1008000000000000000',
    fee: '8000000000000000',
    feePerByte: '8',
    feeLimit: '1000000',
    bytes: 0,
    inputs: [],
    outputs: [],
    outputsPermutation: [],
};
const feeError: GeneralPrecomposedTransaction = { type: 'error', error: 'NOT-ENOUGH-FUNDS' };

type RenderScreenParams = {
    selectedFee: FeeLevelLabel;
    selectedTransaction?: GeneralPrecomposedTransaction;
    normalTransaction?: GeneralPrecomposedTransaction;
    networkReserve?: string;
    amount?: string;
    availableBalance?: string;
};

const renderScreen = ({
    selectedFee,
    selectedTransaction,
    normalTransaction = feeError,
    networkReserve,
    amount = '1',
    availableBalance = '2000000000000000000',
}: RenderScreenParams) => {
    jest.mocked(useSendForm).mockReturnValue({
        form: { formState: { isValid: true, isSubmitting: false }, setValue: jest.fn() },
        handleSubmitSendForm: jest.fn(),
        network: { networkType: 'ethereum' },
        isResolvingNamedAddress: false,
        ...getSendFeeStatus({
            feeLevel: selectedTransaction,
            symbol: account.symbol,
            availableBalance,
            amount,
            networkReserve,
        }),
    } as unknown as NonNullable<ReturnType<typeof useSendForm>>);

    return renderWithStoreProvider(
        <SendOutputsScreen
            route={{
                key: 'send',
                name: SendStackRoutes.SendOutputs,
                params: { accountKey: account.key },
            }}
            navigation={{ setParams: jest.fn() } as never}
        />,
        {
            preloadedState: {
                wallet: {
                    accounts: [account],
                    send: {
                        drafts: { [account.key]: { ...DEFAULT_VALUES, selectedFee } },
                        feeLevels: {
                            normal: normalTransaction,
                            [selectedFee]: selectedTransaction,
                        },
                    },
                },
            },
        },
    );
};

describe('SendOutputsScreen selected fee readiness', () => {
    it.each(['low', 'custom'] as const)(
        'offers review for confirmed %s even when Normal is unaffordable',
        async selectedFee => {
            const view = await renderScreen({ selectedFee, selectedTransaction: finalTransaction });

            expect(view.getByTestId('@send/form-submit-button')).toBeOnTheScreen();
        },
    );

    it.each([feeError, undefined, { ...finalTransaction, type: 'nonfinal' } as const])(
        'does not offer review for an unusable selection even when Normal succeeds (%j)',
        async transaction => {
            const view = await renderScreen({
                selectedFee: 'custom',
                selectedTransaction: transaction,
                normalTransaction: finalTransaction,
            });

            expect(view.queryByTestId('@send/form-submit-button')).toBeNull();
        },
    );

    it.each([
        ['normal', '1000000000000000', false],
        ['low', '500000000000000', true],
        ['custom', '1500000000000000', false],
    ] as const)(
        'offers review for %s only when its fee preserves the reserve',
        async (selectedFee, fee, ready) => {
            const view = await renderScreen({
                selectedFee,
                selectedTransaction: { ...finalTransaction, fee },
                networkReserve: '0.001',
                amount: '0.9985',
                availableBalance: '1000000000000000000',
            });
            if (ready) expect(view.getByTestId('@send/form-submit-button')).toBeOnTheScreen();
            else expect(view.queryByTestId('@send/form-submit-button')).toBeNull();
        },
    );

    it.each([
        ['high', '2000000000000000', '0.997'],
        ['custom', '2500000000000000', '0.9965'],
    ] as const)(
        'keeps Review available for Send Max with %s despite the Normal-filled amount',
        async (selectedFee, fee, max) => {
            const view = await renderScreen({
                selectedFee,
                selectedTransaction: {
                    ...finalTransaction,
                    fee,
                    max,
                    totalSpent: '999000000000000000',
                },
                networkReserve: '0.001',
                amount: '0.998',
                availableBalance: '1000000000000000000',
            });

            expect(view.getByTestId('@send/form-submit-button')).toBeOnTheScreen();
        },
    );
});
