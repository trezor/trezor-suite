import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import {
    act,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
    userEvent,
    waitFor,
} from '@suite-native/test-utils-store';

import { FeesBottomSheet } from './FeesBottomSheet';
import { createFeeLevel } from '../../__fixtures__/feeLevels';
import { ETH_ACCOUNT_KEY, getEthAccount, getWalletState } from '../../__fixtures__/walletState';
import { useFeesForm } from '../../hooks/fees/useFeesForm';

jest.mock('@suite-native/atoms', () => {
    const React = jest.requireActual('react');

    return {
        ...jest.requireActual('@suite-native/atoms'),
        BottomSheetModal: ({
            children,
            footer,
        }: {
            children: React.ReactNode;
            footer: React.ReactNode;
        }) => React.createElement(React.Fragment, null, children, footer),
    };
});
jest.mock('./CustomFee/CustomFeeTabContent', () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');

    return {
        CustomFeeTabContent: ({
            onSubmittableChange,
        }: {
            onSubmittableChange: (value: boolean) => void;
        }) => {
            React.useEffect(() => onSubmittableChange(true), [onSubmittableChange]);

            return React.createElement(View, { testID: 'custom-fee-fields' });
        },
    };
});

it('confirms a valid TRC20 cap after clearing its required field', async () => {
    const symbol = asNetworkSymbol('trx');
    const accountKey = mockAccountKey({ symbol, descriptor: 'tron1' });
    const tokenContract = toTokenAddress('TRC20-token');
    const wallet = getWalletState();
    const feeLevels = {
        normal: createFeeLevel({
            fee: '6328400',
            feePerByte: '100',
            feeLimit: '64285',
            estimatedFeeLimit: '6428500',
        }),
    };
    const preloadedState = {
        wallet: {
            ...wallet,
            accounts: [
                {
                    ...getEthAccount(),
                    key: accountKey,
                    descriptor: 'tron1',
                    symbol,
                    networkType: 'tron',
                },
            ],
            send: { ...wallet.send, feeLevels },
            fees: {
                trx: {
                    status: 'loaded',
                    data: {
                        blockHeight: 0,
                        blockTime: 3,
                        minFee: 0,
                        maxFee: 0,
                        minPriorityFee: 0,
                        levels: [{ label: 'normal', feePerUnit: '0', blocks: 1 }],
                    },
                },
            },
        },
    };
    const { result } = await renderHookWithStoreProvider(useFeesForm, {
        initialProps: {
            accountKey,
            tokenContract,
            defaultFeeLevel: 'normal' as const,
            defaultFeePerUnit: '100',
        },
        preloadedState,
    });
    const form = result.current;
    const onConfirm = jest.fn();
    const closeModal = jest.fn();
    const screen = await renderWithStoreProvider(
        <FeesBottomSheet
            ref={{ current: null }}
            form={form}
            accountKey={accountKey}
            feeLevels={feeLevels}
            symbol={symbol}
            networkType="tron"
            tokenContract={tokenContract}
            areFeesLoading={false}
            isSubmittable
            formDraft={null}
            snapshotRef={{ current: form.getValues() }}
            confirmedRef={{ current: false }}
            onConfirm={onConfirm}
            closeModal={closeModal}
        />,
        { preloadedState },
    );
    const input = screen.getByDisplayValue('6428500');
    const confirmText = getTranslation(
        'transactionManagement.fees.custom.bottomSheet.confirmButton',
    );

    await userEvent.clear(input);
    await waitFor(() => {
        expect(screen.getByText(getTranslation('forms.errors.mixed.required'))).toBeOnTheScreen();
    });
    expect(screen.queryByText(confirmText)).toBeNull();
    await userEvent.type(input, '8000000');
    await userEvent.press(await screen.findByText(confirmText));

    expect(onConfirm).toHaveBeenCalledWith('custom', { customFeeLimit: '8000000' });
    expect(closeModal).toHaveBeenCalledTimes(1);
});

it('validates the active Custom mode and restores the previous Standard selection', async () => {
    const wallet = getWalletState();
    wallet.send.feeLevels.normal = createFeeLevel({
        feeLimit: '21000',
        estimatedFeeLimit: '21000',
        maxFeePerGas: '10',
        maxPriorityFeePerGas: '2',
    });
    const preloadedState = {
        wallet: {
            ...wallet,
            fees: {
                eth: {
                    status: 'loaded' as const,
                    data: {
                        blockHeight: 200,
                        blockTime: 12,
                        minFee: 1,
                        maxFee: 100,
                        minPriorityFee: 1,
                        levels: [
                            {
                                label: 'normal' as const,
                                feePerUnit: '10000000000',
                                maxFeePerGas: '10000000000',
                                maxPriorityFeePerGas: '2000000000',
                                blocks: 2,
                            },
                        ],
                    },
                },
            },
        },
    };
    const { result } = await renderHookWithStoreProvider(useFeesForm, {
        initialProps: {
            accountKey: ETH_ACCOUNT_KEY,
            defaultFeeLevel: 'high' as const,
            defaultFeePerUnit: '10',
        },
        preloadedState,
    });
    const form = result.current;
    const onConfirm = jest.fn();
    const renderBottomSheet = (areFeesLoading: boolean) => (
        <FeesBottomSheet
            ref={{ current: null }}
            form={form}
            accountKey={ETH_ACCOUNT_KEY}
            feeLevels={wallet.send.feeLevels}
            symbol={asNetworkSymbol('eth')}
            networkType="ethereum"
            areFeesLoading={areFeesLoading}
            isSubmittable
            formDraft={null}
            snapshotRef={{ current: form.getValues() }}
            confirmedRef={{ current: false }}
            onConfirm={onConfirm}
            closeModal={jest.fn()}
        />
    );
    const screen = await renderWithStoreProvider(renderBottomSheet(false), { preloadedState });

    await userEvent.press(screen.getByText('Custom fee'));
    expect(form.getValues('feeLevel')).toBe('custom');
    expect(screen.getByText('Confirm custom fee')).toBeOnTheScreen();
    await screen.rerender(renderBottomSheet(true));
    expect(screen.queryByText('Confirm custom fee')).toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
    await screen.rerender(renderBottomSheet(false));
    expect(screen.getByText('Confirm custom fee')).toBeOnTheScreen();
    await act(async () => {
        form.setValue('customMaxFeePerGas', '');
        expect(await form.trigger('customMaxFeePerGas')).toBe(false);
    });
    expect(form.getFieldState('customMaxFeePerGas').error).toBeDefined();
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.press(screen.getByText('Standard fee'));
    expect(form.getValues('feeLevel')).toBe('high');
    await userEvent.press(screen.getByText('Custom fee'));
    await act(() => form.reset({ ...form.getValues(), feeLevel: 'normal' }));
    expect(screen.queryByTestId('custom-fee-fields')).toBeNull();
});
