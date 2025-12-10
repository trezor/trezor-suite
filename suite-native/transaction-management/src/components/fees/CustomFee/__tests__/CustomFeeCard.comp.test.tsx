import { AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
    userEvent,
} from '@suite-native/test-utils';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { FeesFormType } from '../../../../feesFormSchema';
import { useFeesForm } from '../../../../hooks';
import { CustomFeeCard, CustomFeeCardProps } from '../CustomFeeCard';

describe('CustomFeeCard', () => {
    const defaultProps = {
        accountKey: 'eth-account-1' as AccountKey,
        onEdit: jest.fn(),
        onCancel: jest.fn(),
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

    const renderCustomFeeCard = ({
        form,
        preloadedState,
        props,
    }: {
        form: FeesFormType;
        preloadedState?: PreloadedState;
        props?: Partial<CustomFeeCardProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProviderAsync(<CustomFeeCard {...finalProps} />, {
            preloadedState: preloadedState || defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render custom fee card when custom fee transaction is available', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeCard({
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
            expect(getByText('Cancel')).toBeTruthy();
            expect(getByText('Edit')).toBeTruthy();
        });

        it('should display fee amount correctly', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeCard({
                form,
            });

            expect(getByText('0.000000426691398 ETH')).toBeTruthy();
        });

        it('should display price and limit correctly', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeCard({
                form,
            });

            expect(getByText('1.00 Gwei')).toBeTruthy();
        });

        it('should not render if using wrong accountKey', async () => {
            const accountKey = 'wrong-key' as AccountKey;
            const form = await renderUseFeesForm(accountKey);
            const { toJSON } = await renderCustomFeeCard({
                form,
                props: {
                    accountKey,
                },
            });

            expect(toJSON()).toBeNull();
        });
    });

    describe('Interaction', () => {
        it('should call onEdit when edit button is pressed', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeCard({
                form,
            });

            await userEvent.press(getByText('Edit'));

            expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when cancel button is pressed', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeCard({
                form,
            });

            await userEvent.press(getByText('Cancel'));

            expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
        });
    });

    it('should render for bitcoin network', async () => {
        const accountKey = 'btc-account-1' as AccountKey;
        const form = await renderUseFeesForm(accountKey);
        const { getByText } = await renderCustomFeeCard({
            form,
            props: {
                accountKey,
            },
        });

        expect(getByText('1 sat/vB')).toBeTruthy();
    });
});
