import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { type UseFeesFormProps, useFeesForm } from './useFeesForm';

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

    it('should initialize with default values', () => {
        const { result } = renderUseFeesForm();

        expect(result.current.getValues()).toEqual({
            feeLevel: 'normal',
            customFeePerUnit: '20000000000',
            customFeeLimit: '11000',
        });
    });

    it('should update fee level when changed', () => {
        const { result } = renderUseFeesForm();

        act(() => {
            result.current.setValue('feeLevel', 'high');
        });

        expect(result.current.getValues('feeLevel')).toBe('high');
    });

    it('should update custom fee per unit when changed', () => {
        const { result } = renderUseFeesForm();

        act(() => {
            result.current.setValue('customFeePerUnit', '30000000000');
        });

        expect(result.current.getValues('customFeePerUnit')).toBe('30000000000');
    });

    it('should update custom fee limit when changed', () => {
        const { result } = renderUseFeesForm();

        act(() => {
            result.current.setValue('customFeeLimit', '21000');
        });

        expect(result.current.getValues('customFeeLimit')).toBe('21000');
    });

    it('should handle empty fee levels without crashing', () => {
        const { result } = renderHookWithStoreProvider(() => useFeesForm(mockProps), {
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

    it('should initialize with custom default values', () => {
        const customProps: UseFeesFormProps = {
            accountKey: ETH_ACCOUNT_KEY,
            defaultFeeLevel: 'high',
            defaultFeePerUnit: '15000000000',
        };

        const { result } = renderUseFeesForm(customProps);

        expect(result.current.getValues()).toEqual({
            feeLevel: 'high',
            customFeePerUnit: '15000000000',
            customFeeLimit: '11000',
        });
    });
});
