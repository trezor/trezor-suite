import { AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import { userEvent } from '@suite-native/test-utils';
import { type PreloadedState, renderHookWithStoreProvider, renderWithStoreProvider } from '@suite-native/test-utils/store';

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

    const renderUseFeesForm = (
        accountKey: AccountKey = 'eth-account-1' as AccountKey, // Todo: create properly via `createAccountKey()`,
        preloadedState?: PreloadedState,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = renderHookWithStoreProvider(
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

        return renderWithStoreProvider(<CustomFeeCard {...finalProps} />, {
            preloadedState: preloadedState || defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render custom fee card when custom fee transaction is available', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeCard({
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
            expect(getByText('Cancel')).toBeTruthy();
            expect(getByText('Edit')).toBeTruthy();
        });

        it('should display fee amount correctly', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeCard({
                form,
            });

            expect(getByText('0.000000426691398 ETH')).toBeTruthy();
        });

        it('should display price and limit correctly', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeCard({
                form,
            });

            expect(getByText('1.00 Gwei')).toBeTruthy();
        });

        it('should not render if using wrong accountKey', () => {
            const accountKey = 'wrong-key' as AccountKey;
            const form = renderUseFeesForm(accountKey);
            const { toJSON } = renderCustomFeeCard({
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
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeCard({
                form,
            });

            await userEvent.press(getByText('Edit'));

            expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when cancel button is pressed', async () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeCard({
                form,
            });

            await userEvent.press(getByText('Cancel'));

            expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
        });
    });

    it('should render for bitcoin network', () => {
        const accountKey = 'btc-account-1' as AccountKey;
        const form = renderUseFeesForm(accountKey);
        const { getByText } = renderCustomFeeCard({
            form,
            props: {
                accountKey,
            },
        });

        expect(getByText('1 sat/vB')).toBeTruthy();
    });
});
