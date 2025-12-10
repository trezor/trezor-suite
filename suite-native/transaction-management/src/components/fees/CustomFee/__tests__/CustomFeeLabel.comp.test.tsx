import { NetworkType as NetworkTypeConfig } from '@suite-common/wallet-config';
import { Form } from '@suite-native/forms';
import {
    PreloadedState,
    act,
    renderHookWithStoreProviderAsync,
    renderWithStoreProviderAsync,
} from '@suite-native/test-utils';

import { getWalletState } from '../../../../__fixtures__/walletState';
import { FeesFormType } from '../../../../feesFormSchema';
import { useFeesForm } from '../../../../hooks';
import { CustomFeeLabel } from '../CustomFeeLabel';

describe('CustomFeeLabel', () => {
    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = async (
        preloadedState?: PreloadedState,
        defaultFeePerUnit?: string,
    ) => {
        const { result } = await renderHookWithStoreProviderAsync(
            () =>
                useFeesForm({
                    accountKey: 'test-account-key',
                    defaultFeePerUnit: defaultFeePerUnit || '1',
                }),
            {
                preloadedState: preloadedState || defaultState,
            },
        );

        return result.current;
    };

    const renderCustomFeeLabel = ({
        networkType,
        form,
        preloadedState,
    }: {
        networkType: NetworkTypeConfig;
        form: FeesFormType;
        preloadedState?: PreloadedState;
    }) =>
        renderWithStoreProviderAsync(<CustomFeeLabel networkType={networkType} />, {
            preloadedState: preloadedState || defaultState,
            wrapper: ({ children }) => <Form form={form}>{children}</Form>,
        });

    describe('Bitcoin Network', () => {
        it('should render custom fee label for bitcoin', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({
                networkType: 'bitcoin',
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
        });

        it('should display fee per unit with correct units', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({ networkType: 'bitcoin', form });

            expect(getByText(/sat\/vB/)).toBeTruthy();
        });

        it('should handle different fee per unit values', async () => {
            const form = await renderUseFeesForm();

            act(() => {
                form.setValue('customFeePerUnit', '50');
            });

            const { getByText } = await renderCustomFeeLabel({
                networkType: 'bitcoin',
                form,
            });

            expect(getByText('50 sat/vB')).toBeTruthy();
        });
    });

    describe('Ethereum Network', () => {
        it('should render custom fee label for ethereum', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
        });

        it('should display gas price and gas limit for ethereum', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/Gwei/)).toBeTruthy();
        });

        it('should display fee per unit with Gwei units for ethereum', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/Gwei/)).toBeTruthy();
        });

        it('should handle different gas price and gas limit values', async () => {
            const form = await renderUseFeesForm();

            act(() => {
                form.setValue('customFeePerUnit', '25');
                form.setValue('customFeeLimit', '50000');
            });

            const { getByText } = await renderCustomFeeLabel({
                networkType: 'ethereum',
                form,
            });

            expect(getByText(/25.00 Gwei/)).toBeTruthy();
        });
    });

    describe('Other Networks', () => {
        it('should render custom fee label for other networks', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({
                networkType: 'ripple',
                form,
            });

            expect(getByText(/Custom/)).toBeTruthy();
        });

        it('should display fee per unit with appropriate units for other networks', async () => {
            const form = await renderUseFeesForm();
            const { getByText } = await renderCustomFeeLabel({
                networkType: 'ripple',
                form,
            });

            expect(getByText(/Drops/)).toBeTruthy();
        });
    });
});
