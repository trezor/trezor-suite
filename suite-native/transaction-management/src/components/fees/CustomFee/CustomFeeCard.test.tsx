import { type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Form } from '@suite-native/forms';
import { getTranslation } from '@suite-native/intl';
import {
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { CustomFeeCard, type CustomFeeCardProps } from './CustomFeeCard';
import {
    BTC_ACCOUNT_KEY,
    ETH_ACCOUNT_KEY,
    getWalletState,
} from '../../../__fixtures__/walletState';
import { type FeesFormType } from '../../../feesFormSchema';
import { useFeesForm } from '../../../hooks';

describe('CustomFeeCard', () => {
    const defaultProps = {
        accountKey: ETH_ACCOUNT_KEY,
        onEdit: jest.fn(),
        onCancel: jest.fn(),
    };

    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = (accountKey: AccountKey = ETH_ACCOUNT_KEY) => {
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

    const renderCustomFeeCard = ({
        form,
        props,
    }: {
        form: FeesFormType;
        props?: Partial<CustomFeeCardProps>;
    }) => {
        const finalProps = { ...defaultProps, ...props };

        return renderWithStoreProvider(<CustomFeeCard {...finalProps} />, {
            preloadedState: defaultState,
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
            expect(getByText(getTranslation('generic.buttons.cancel'))).toBeTruthy();
            expect(getByText(getTranslation('generic.buttons.edit'))).toBeTruthy();
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
            const accountKey = mockAccountKey({ descriptor: 'wrongKey' });
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

            await userEvent.press(getByText(getTranslation('generic.buttons.edit')));

            expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
        });

        it('should call onCancel when cancel button is pressed', async () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeCard({
                form,
            });

            await userEvent.press(getByText(getTranslation('generic.buttons.cancel')));

            expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
        });
    });

    it('should render for bitcoin network', () => {
        const accountKey = BTC_ACCOUNT_KEY;
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
