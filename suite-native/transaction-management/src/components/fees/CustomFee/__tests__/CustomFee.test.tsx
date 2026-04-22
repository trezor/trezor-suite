import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { type FeesFormType } from '../../../../feesFormSchema';
import { type CustomFeeParams, useFeesForm } from '../../../../hooks';
import { useCustomFee } from '../../../../hooks/fees/useCustomFee';
import { CustomFee } from '../CustomFee';

// Mock the useCustomFee hook
jest.mock('../../../../hooks/fees/useCustomFee', () => ({
    useCustomFee: jest.fn(),
}));

const mockUseCustomFee = jest.mocked(useCustomFee);

type CustomFeeProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    formDraft: FormState | null | undefined;
    onCustomFeeSet: (customFeeParams: CustomFeeParams) => void;
};

describe('CustomFee', () => {
    const defaultProps: CustomFeeProps = {
        accountKey: 'eth-account-1' as AccountKey,
        symbol: 'eth' as NetworkSymbol,
        formDraft: null,
        onCustomFeeSet: jest.fn(),
    };

    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = (
        accountKey: AccountKey = 'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
    ) => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: '1',
                }),
            {
                preloadedState: defaultState,
            },
        );

        return result.current;
    };

    const renderCustomFee = ({
        form,
        props,
    }: {
        form: FeesFormType;
        props?: Partial<CustomFeeProps>;
    }) => {
        // Create a mock FormState that matches the expected structure
        const mockFormDraft: FormState = {
            outputs: [],
            feePerUnit: '1',
            feeLimit: '21000',
            selectedUtxos: [],
            utxoSorting: 'newestFirst',
            options: [],
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
        };

        const finalProps = {
            ...defaultProps,
            ...props,
            formDraft: mockFormDraft,
        };

        return renderWithStoreProvider(<CustomFee {...finalProps} />, {
            preloadedState: defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    beforeEach(() => {
        // Default mock implementation for useCustomFee
        mockUseCustomFee.mockReturnValue({
            feeValue: '1000',
            isFeeLoading: false,
            isErrorBoxVisible: false,
            isSubmittable: true,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render custom fee button when custom fee is not selected', () => {
        const form = renderUseFeesForm();
        const { getByTestId, getByText } = renderCustomFee({
            form,
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
        expect(getByText('Add custom fee')).toBeTruthy();
    });

    it('should render custom fee card when custom fee is selected', () => {
        const form = renderUseFeesForm();

        // Set fee level to custom
        act(() => {
            form.setValue('feeLevel', 'custom');
        });

        const { getByText } = renderCustomFee({
            form,
        });

        expect(getByText(/Custom/)).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Edit')).toBeTruthy();
    });

    it('should not render for solana network', () => {
        const form = renderUseFeesForm();
        const { toJSON } = renderCustomFee({
            form,
            props: {
                symbol: 'sol' as NetworkSymbol,
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('should not call useCustomFee hook for solana network', () => {
        const form = renderUseFeesForm();

        // Clear any previous calls
        mockUseCustomFee.mockClear();

        renderCustomFee({
            form,
            props: {
                symbol: 'sol' as NetworkSymbol,
            },
        });

        // Verify that useCustomFee was not called for Solana
        expect(mockUseCustomFee).not.toHaveBeenCalled();
    });

    it('should call useCustomFee hook for ethereum network', () => {
        const form = renderUseFeesForm();

        // Clear any previous calls
        mockUseCustomFee.mockClear();

        renderCustomFee({
            form,
            props: {
                symbol: 'eth' as NetworkSymbol,
            },
        });

        // Verify that useCustomFee was called for Ethereum
        expect(mockUseCustomFee).toHaveBeenCalledWith({
            accountKey: 'eth-account-1',
            formState: expect.any(Object),
        });
    });

    it('should render for bitcoin network', () => {
        const form = renderUseFeesForm();
        const { getByTestId } = renderCustomFee({
            form,
            props: {
                symbol: 'btc' as NetworkSymbol,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should render for ethereum network', () => {
        const form = renderUseFeesForm();
        const { getByTestId } = renderCustomFee({
            form,
            props: {
                symbol: 'eth' as NetworkSymbol,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should open bottom sheet when edit button is pressed', async () => {
        const form = renderUseFeesForm();

        // Set fee level to custom to show the card
        act(() => {
            form.setValue('feeLevel', 'custom');
        });

        const { getByText } = renderCustomFee({
            form,
        });

        await userEvent.press(getByText('Edit'));

        expect(getByText('Gas limit')).toBeTruthy();
    });

    it('should handle different account keys', () => {
        const form = renderUseFeesForm(
            'btc-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`
        );
        const { getByTestId } = renderCustomFee({
            form,
            props: {
                accountKey: 'btc-account-1' as AccountKey,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });
});
