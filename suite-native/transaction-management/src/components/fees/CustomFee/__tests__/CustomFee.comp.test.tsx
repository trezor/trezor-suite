import { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey } from '@suite-common/wallet-types';
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
import { useFeesForm } from '../../../../hooks/useFeesForm';
import { CustomFee } from '../CustomFee';

type CustomFeeProps = {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    feeValue: string;
    isFeeLoading: boolean;
    isSubmittable: boolean;
    isErrorBoxVisible: boolean;
    onCustomFeeSet: (feePerUnit: string, feeLimit?: string) => void;
};

describe('CustomFee', () => {
    const defaultProps: CustomFeeProps = {
        accountKey: 'eth-account-1' as AccountKey,
        symbol: 'eth' as NetworkSymbol,
        feeValue: '1',
        isFeeLoading: false,
        isSubmittable: true,
        isErrorBoxVisible: false,
        onCustomFeeSet: jest.fn(),
    };

    const defaultState = {
        wallet: { ...getWalletState() },
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
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProviderAsync(<CustomFee {...finalProps} />, {
            preloadedState: preloadedState || defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

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

    it('should handle different fee values', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                feeValue: '50',
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should handle loading state', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                isFeeLoading: true,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
    });

    it('should handle error state', async () => {
        const form = await renderUseFeesForm();
        const { getByTestId } = await renderCustomFee({
            form,
            props: {
                isErrorBoxVisible: true,
            },
        });

        expect(getByTestId('@transactionManagement/fees-level-custom')).toBeTruthy();
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
