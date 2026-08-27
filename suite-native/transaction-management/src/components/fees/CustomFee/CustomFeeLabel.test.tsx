import { type NetworkType as NetworkTypeConfig } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { Form } from '@suite-native/forms';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';

import { CustomFeeLabel } from './CustomFeeLabel';
import { getWalletState } from '../../../__fixtures__/walletState';
import { type FeesFormType } from '../../../feesFormSchema';
import { useFeesForm } from '../../../hooks';

describe('CustomFeeLabel', () => {
    const defaultState = {
        wallet: getWalletState(),
    };

    const renderUseFeesForm = async () => {
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey: mockAccountKey({ descriptor: 'testAccountKey' }),
                    defaultFeePerUnit: '1',
                }),
            {
                preloadedState: defaultState,
            },
        );

        return result.current;
    };

    const renderCustomFeeLabel = async ({
        networkType,
        form,
    }: {
        networkType: NetworkTypeConfig;
        form: FeesFormType;
    }) =>
        await renderWithStoreProvider(<CustomFeeLabel networkType={networkType} />, {
            preloadedState: defaultState,
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

            await act(() => {
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

            await act(() => {
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
