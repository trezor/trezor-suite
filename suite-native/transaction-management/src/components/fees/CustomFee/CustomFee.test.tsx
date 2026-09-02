import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { CustomFee } from './CustomFee';
import {
    BTC_ACCOUNT_KEY,
    ETH_ACCOUNT_KEY,
    getWalletState,
} from '../../../__fixtures__/walletState';
import { type FeesFormType } from '../../../feesFormSchema';
import { type CustomFeeParams, useFeesForm } from '../../../hooks';
import { useCustomFee } from '../../../hooks/fees/useCustomFee';

// Mock the useCustomFee hook
jest.mock('../../../hooks/fees/useCustomFee', () => ({
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
        accountKey: ETH_ACCOUNT_KEY,
        symbol: 'eth' as NetworkSymbol,
        formDraft: null,
        onCustomFeeSet: jest.fn(),
    };

    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = async (accountKey: AccountKey = ETH_ACCOUNT_KEY) => {
        const { result } = await renderHookWithStoreProvider(
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

    const renderCustomFee = async ({
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

        return await renderWithStoreProvider(<CustomFee {...finalProps} />, {
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

    it('should render custom fee button when custom fee is not selected', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId, getByText } = await renderCustomFee({
            form,
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
        expect(
            getByText(getTranslation('transactionManagement.fees.custom.addButton')),
        ).toBeTruthy();
    });

    it('should render custom fee card when custom fee is selected', async () => {
        const form = await renderUseFeesForm();

        // Set fee level to custom
        await act(() => {
            form.setValue('feeLevel', 'custom');
        });

        const { getByText } = await renderCustomFee({
            form,
        });

        expect(getByText(/Custom/)).toBeTruthy();
        expect(getByText(getTranslation('generic.buttons.cancel'))).toBeTruthy();
        expect(getByText(getTranslation('generic.buttons.edit'))).toBeTruthy();
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
            accountKey: ETH_ACCOUNT_KEY,
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
        await act(() => {
            form.setValue('feeLevel', 'custom');
        });

        const { getByText } = await renderCustomFee({
            form,
        });

        await userEvent.press(getByText(getTranslation('generic.buttons.edit')));

        expect(
            getByText(
                getTranslation('transactionManagement.fees.custom.bottomSheet.label.gasLimit'),
            ),
        ).toBeTruthy();
    });

    it('should handle different account keys', async () => {
        const form = await renderUseFeesForm(BTC_ACCOUNT_KEY);
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                accountKey: BTC_ACCOUNT_KEY,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });
});
