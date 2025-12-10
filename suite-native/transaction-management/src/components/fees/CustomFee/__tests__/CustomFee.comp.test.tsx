import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, FormState } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { FeesFormType } from '../../../../feesFormSchema';
import { CustomFeeParams, useFeesForm } from '../../../../hooks';
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

    const renderUseFeesForm = async (
        accountKey: AccountKey = 'eth-account-1',
        preloadedState?: PreloadedState,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(
            () =>
                useFeesForm({
                    accountKey,
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            {
                preloadedState: preloadedState || defaultState,
            },
        );

        return result.current;
    };

    const renderCustomFee = ({
        form,
        preloadedState,
        props,
    }: {
        form: FeesFormType;
        preloadedState?: PreloadedState;
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

        return renderWithStoreProviderAsync(<CustomFee {...finalProps} />, {
            preloadedState: preloadedState || defaultState,
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

    it('should render custom fee button when custom fee is not selected', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId, getByText } = await renderCustomFee({
            form,
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
        expect(getByText('Add custom fee')).toBeTruthy();
    });

    it('should render custom fee card when custom fee is selected', async () => {
        const form = await renderUseFeesForm();

        // Set fee level to custom
        act(() => {
            form.setValue('feeLevel', 'custom');
        });

        const { getByText } = await renderCustomFee({
            form,
        });

        expect(getByText(/Custom/)).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Edit')).toBeTruthy();
    });

    it('should not render for solana network', async () => {
        const form = await renderUseFeesForm();
        const { toJSON } = await renderCustomFee({
            form,
            props: {
                symbol: 'sol' as NetworkSymbol,
            },
        });

        expect(toJSON()).toBeNull();
    });

    it('should not call useCustomFee hook for solana network', async () => {
        const form = await renderUseFeesForm();

        // Clear any previous calls
        mockUseCustomFee.mockClear();

        await renderCustomFee({
            form,
            props: {
                symbol: 'sol' as NetworkSymbol,
            },
        });

        // Verify that useCustomFee was not called for Solana
        expect(mockUseCustomFee).not.toHaveBeenCalled();
    });

    it('should call useCustomFee hook for ethereum network', async () => {
        const form = await renderUseFeesForm();

        // Clear any previous calls
        mockUseCustomFee.mockClear();

        await renderCustomFee({
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

    it('should render for bitcoin network', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                symbol: 'btc' as NetworkSymbol,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should render for ethereum network', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                symbol: 'eth' as NetworkSymbol,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should open bottom sheet when edit button is pressed', async () => {
        const form = await renderUseFeesForm();

        // Set fee level to custom to show the card
        act(() => {
            form.setValue('feeLevel', 'custom');
        });

        const { getByText } = await renderCustomFee({
            form,
        });

        await userEvent.press(getByText('Edit'));

        // Verify the confirm button is present
        expect(getByText('Confirm custom fee')).toBeTruthy();
    });

    it('should handle different account keys', async () => {
        const form = await renderUseFeesForm('btc-account-1');
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                accountKey: 'btc-account-1' as AccountKey,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });
});
