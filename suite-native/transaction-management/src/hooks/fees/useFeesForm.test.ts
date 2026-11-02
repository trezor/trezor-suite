import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { type UseFeesFormProps, useFeesForm } from './useFeesForm';
import { createFeeLevel } from '../../__fixtures__/feeLevels';
import {
    ETH_ACCOUNT_KEY as FIXTURE_ACCOUNT_KEY,
    getWalletState,
} from '../../__fixtures__/walletState';

const ethSymbol = asNetworkSymbol('eth');
const ETH_ACCOUNT_KEY = mockAccountKey({ symbol: ethSymbol, descriptor: 'eth1' });

describe('useFeesForm', () => {
    const mockProps: UseFeesFormProps = {
        accountKey: ETH_ACCOUNT_KEY,
        defaultFeeLevel: 'normal',
        defaultFeePerUnit: '20000000000', // 20 gwei
    };

    const renderUseFeesForm = (props: UseFeesFormProps = mockProps) =>
        renderHookWithStoreProvider(() => useFeesForm(props), {
            preloadedState: {
                wallet: {
                    fees: {},
                    send: {
                        feeLevels: {
                            normal: {
                                type: 'final',
                                totalSpent: '1000433210428000',
                                fee: '433210428000',
                                feePerByte: '0.020629068',
                                feeLimit: '11000',
                                bytes: 0,
                                inputs: [],
                                estimatedFeeLimit: '11000',
                            },
                            high: {
                                type: 'final',
                                totalSpent: '1000433210428000',
                                fee: '733210428000',
                                feePerByte: '0.040629068',
                                feeLimit: '21000',
                                bytes: 0,
                                inputs: [],
                                estimatedFeeLimit: '21000',
                            },
                            custom: {
                                type: 'final',
                                totalSpent: '1000426691398000',
                                fee: '426691398000',
                                feePerByte: '0.020318638',
                                feeLimit: '31000',
                                bytes: 0,
                                inputs: [],
                                estimatedFeeLimit: '31000',
                            },
                        },
                    },
                    accounts: [
                        {
                            symbol: ethSymbol,
                            networkType: 'ethereum',
                            key: ETH_ACCOUNT_KEY,
                            path: "m/44'/60'/0'/0/0",
                            balance: '1000000000000000000',
                            availableBalance: '1000000000000000000',
                            formattedBalance: '1.0',
                            tokens: [],
                            empty: false,
                            history: { total: 0, unconfirmed: 0 },
                        },
                    ],
                },
            },
        });

    it('should initialize with default values', async () => {
        const { result } = await renderUseFeesForm();

        expect(result.current.getValues()).toEqual({
            feeLevel: 'normal',
            customFeePerUnit: '20000000000',
            customFeeLimit: '11000',
        });
    });

    it('should update fee level when changed', async () => {
        const { result } = await renderUseFeesForm();

        await act(() => {
            result.current.setValue('feeLevel', 'high');
        });

        expect(result.current.getValues('feeLevel')).toBe('high');
    });

    it('should update custom fee per unit when changed', async () => {
        const { result } = await renderUseFeesForm();

        await act(() => {
            result.current.setValue('customFeePerUnit', '30000000000');
        });

        expect(result.current.getValues('customFeePerUnit')).toBe('30000000000');
    });

    it('should update custom fee limit when changed', async () => {
        const { result } = await renderUseFeesForm();

        await act(() => {
            result.current.setValue('customFeeLimit', '21000');
        });

        expect(result.current.getValues('customFeeLimit')).toBe('21000');
    });

    it('should handle empty fee levels without crashing', async () => {
        const { result } = await renderHookWithStoreProvider(() => useFeesForm(mockProps), {
            preloadedState: {
                wallet: {
                    fees: {},
                    send: {
                        feeLevels: {},
                    },
                    accounts: [
                        {
                            symbol: ethSymbol,
                            networkType: 'ethereum',
                            key: ETH_ACCOUNT_KEY,
                            path: "m/44'/60'/0'/0/0",
                            balance: '1000000000000000000',
                            availableBalance: '1000000000000000000',
                            formattedBalance: '1.0',
                            tokens: [],
                            empty: false,
                            history: { total: 0, unconfirmed: 0 },
                        },
                    ],
                },
            },
        });

        expect(result.current.getValues('feeLevel')).toBe('normal');
        expect(result.current.getValues('customFeeLimit')).toBeUndefined();
    });

    it('should initialize with custom default values', async () => {
        const customProps: UseFeesFormProps = {
            accountKey: ETH_ACCOUNT_KEY,
            defaultFeeLevel: 'high',
            defaultFeePerUnit: '15000000000',
        };

        const { result } = await renderUseFeesForm(customProps);

        expect(result.current.getValues()).toEqual({
            feeLevel: 'high',
            customFeePerUnit: '15000000000',
            customFeeLimit: '11000',
        });
    });

    it('allows custom gas validation from an available level when normal is unavailable', async () => {
        const wallet = getWalletState();
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey: FIXTURE_ACCOUNT_KEY,
                    defaultFeeLevel: 'low',
                    defaultFeePerUnit: '8',
                }),
            {
                preloadedState: {
                    wallet: {
                        ...wallet,
                        send: {
                            ...wallet.send,
                            feeLevels: {
                                normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                                low: createFeeLevel({
                                    feeLimit: '30000',
                                    estimatedFeeLimit: '21000',
                                    maxFeePerGas: '8',
                                    maxPriorityFeePerGas: '1',
                                }),
                            },
                        },
                    },
                },
            },
        );
        expect(result.current.getValues('customFeeLimit')).toBe('30000');
        await act(async () => {
            expect(await result.current.trigger('customFeeLimit')).toBe(true);
        });
        await act(async () => {
            result.current.setValue('customFeeLimit', '20000');
            expect(await result.current.trigger('customFeeLimit')).toBe(false);
        });
    });

    it('validates Ethereum prepared fees that provide a gas limit without a separate estimate', async () => {
        const wallet = getWalletState();
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey: FIXTURE_ACCOUNT_KEY,
                    defaultFeeLevel: 'normal',
                    defaultFeePerUnit: '8',
                }),
            {
                preloadedState: {
                    wallet: {
                        ...wallet,
                        send: {
                            ...wallet.send,
                            feeLevels: {
                                normal: createFeeLevel({
                                    feeLimit: '30000',
                                    estimatedFeeLimit: undefined,
                                }),
                            },
                        },
                    },
                },
            },
        );
        await act(async () => {
            expect(await result.current.trigger('customFeeLimit')).toBe(true);
        });
        await act(async () => {
            result.current.setValue('customFeeLimit', '29999');
            expect(await result.current.trigger('customFeeLimit')).toBe(false);
        });
    });

    it('does not use a previous Custom gas limit as a minimum when all standard levels failed', async () => {
        const wallet = getWalletState();
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey: FIXTURE_ACCOUNT_KEY,
                    defaultFeeLevel: 'custom',
                    defaultFeePerUnit: '8',
                }),
            {
                preloadedState: {
                    wallet: {
                        ...wallet,
                        send: {
                            ...wallet.send,
                            feeLevels: {
                                normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                                custom: createFeeLevel({
                                    feeLimit: '90000',
                                    estimatedFeeLimit: undefined,
                                }),
                            },
                        },
                    },
                },
            },
        );
        await act(async () => {
            result.current.setValue('customFeeLimit', '45000');
            expect(await result.current.trigger('customFeeLimit')).toBe(false);
        });
    });
    it('uses a composed Custom estimate without trusting its user-entered gas limit', async () => {
        const wallet = getWalletState();
        const { result } = await renderHookWithStoreProvider(
            () =>
                useFeesForm({
                    accountKey: FIXTURE_ACCOUNT_KEY,
                    defaultFeeLevel: 'custom',
                    defaultFeePerUnit: '8',
                }),
            {
                preloadedState: {
                    wallet: {
                        ...wallet,
                        send: {
                            ...wallet.send,
                            feeLevels: {
                                normal: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                                custom: createFeeLevel({
                                    feeLimit: '90000',
                                    estimatedFeeLimit: '45000',
                                }),
                            },
                        },
                    },
                },
            },
        );
        await act(async () => {
            result.current.setValue('customFeeLimit', '45000');
            expect(await result.current.trigger('customFeeLimit')).toBe(true);
        });
        await act(async () => {
            result.current.setValue('customFeeLimit', '44999');
            expect(await result.current.trigger('customFeeLimit')).toBe(false);
        });
    });
});
