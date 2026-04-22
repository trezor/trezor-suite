import { type NetworkType as NetworkTypeConfig } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { type FeesFormType } from '../../../../feesFormSchema';
import { useFeesForm } from '../../../../hooks';
import { CustomFeeLabel } from '../CustomFeeLabel';

describe('CustomFeeLabel', () => {
    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = () => {
        const { result } = renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey: 'test-account-key' as AccountKey, // Todo: create properly via `createAccountKey()`,
                    defaultFeePerUnit: '1',
                }),
            {
                preloadedState: defaultState,
            },
        );

        return result.current;
    };

    const renderCustomFeeLabel = ({
        networkType,
        form,
    }: {
        networkType: NetworkTypeConfig;
        form: FeesFormType;
    }) =>
        renderWithStoreProvider(<CustomFeeLabel networkType={networkType} />, {
            preloadedState: defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    describe('Bitcoin Network', () => {
        it('should render custom fee label for bitcoin', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({
                networkType: 'bitcoin',
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
        });

        it('should display fee per unit with correct units', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({ networkType: 'bitcoin', form });

            expect(getByText(/sat\/vB/)).toBeTruthy();
        });

        it('should handle different fee per unit values', () => {
            const form = renderUseFeesForm();

            act(() => {
                form.setValue('customFeePerUnit', '50');
            });

            const { getByText } = renderCustomFeeLabel({
                networkType: 'bitcoin',
                form,
            });

            expect(getByText('50 sat/vB')).toBeTruthy();
        });
    });

    describe('Ethereum Network', () => {
        it('should render custom fee label for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
        });

        it('should display gas price and gas limit for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/Gwei/)).toBeTruthy();
        });

        it('should display fee per unit with Gwei units for ethereum', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/Gwei/)).toBeTruthy();
        });

        it('should handle different gas price and gas limit values', () => {
            const form = renderUseFeesForm();

            act(() => {
                form.setValue('customFeePerUnit', '25');
                form.setValue('customFeeLimit', '50000');
            });

            const { getByText } = renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/25.00 Gwei/)).toBeTruthy();
        });
    });

    describe('Other Networks', () => {
        it('should render custom fee label for other networks', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({
                networkType: 'ripple',
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
        });

        it('should display fee per unit with appropriate units for other networks', () => {
            const form = renderUseFeesForm();
            const { getByText } = renderCustomFeeLabel({
                networkType: 'ripple',
                form,
            });

            expect(getByText(/Drops/)).toBeTruthy();
        });
    });
});
