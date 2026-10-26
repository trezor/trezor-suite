import { type Store } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeesRootState } from '@suite-common/wallet-core';
import { Form, useForm, yup } from '@suite-native/forms';
import {
    createStoreFromPreloadedState,
    renderWithStoreProvider,
    userEvent,
} from '@suite-native/test-utils-store';

import { FeeOption } from './FeeOption';
import { createFeeLevel } from '../../../__fixtures__/feeLevels';
import { getWalletState } from '../../../__fixtures__/walletState';
import { type NativeSupportedPredefinedFeeLevel } from '../../../types';

type State = FeesRootState;

// Create a simple validation schema for testing
const testValidationSchema = yup.object({
    feeLevel: yup.string().required(),
    customFeePerUnit: yup.string(),
    customFeeLimit: yup.string(),
});

// Create a form wrapper component for testing
const TestFormWrapper = ({ children }: { children: React.ReactNode }) => {
    const form = useForm({
        validation: testValidationSchema,
        defaultValues: {
            feeLevel: 'normal',
            customFeePerUnit: '',
            customFeeLimit: '',
        },
    });

    return <Form form={form}>{children}</Form>;
};

// Mock the fee-related selectors
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectConvertedNetworkFeeLevelTimeEstimate: jest.fn(),
    selectNetworkFeeLevel: jest.fn(),
}));

const mockSelectConvertedNetworkFeeLevelTimeEstimate = jest.requireMock(
    '@suite-common/wallet-core',
).selectConvertedNetworkFeeLevelTimeEstimate;
const mockSelectNetworkFeeLevel = jest.requireMock(
    '@suite-common/wallet-core',
).selectNetworkFeeLevel;

describe('FeeOption', () => {
    let store: Store<State>;
    let mockOnSelectedFeeLevel: jest.Mock;

    const defaultProps = {
        feeKey: 'normal' as NativeSupportedPredefinedFeeLevel,
        feeLevel: createFeeLevel({
            totalSpent: '100000',
            fee: '1000',
            feePerByte: '10',
            feeLimit: '21000',
        }),
        symbol: 'btc' as NetworkSymbol,
        isInteractive: true,
        isLoading: false,
        onSelectedFeeLevel: jest.fn(),
    };

    const getPreloadedState = (): State => ({
        wallet: getWalletState(),
    });

    const renderFeeOption = (props = {}) => {
        const finalProps = { ...defaultProps, ...props };
        mockOnSelectedFeeLevel = finalProps.onSelectedFeeLevel;

        return renderWithStoreProvider(
            <TestFormWrapper>
                <FeeOption {...finalProps} />
            </TestFormWrapper>,
            { services: { store }, preloadedState: getPreloadedState() },
        );
    };

    beforeEach(() => {
        store = createStoreFromPreloadedState(getPreloadedState());

        // Default mock implementations
        mockSelectConvertedNetworkFeeLevelTimeEstimate.mockReturnValue('~10 minutes');
        mockSelectNetworkFeeLevel.mockReturnValue({ label: 'normal', feePerUnit: '10', blocks: 2 });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it.each([
            ['normal', /Normal/],
            ['economy', /Low/],
            ['high', /High/],
        ])('should render %s fee level with correct label', async (feeKey, expectedLabel) => {
            const { getByText } = await renderFeeOption({ feeKey });

            expect(getByText(expectedLabel)).toBeTruthy();
        });

        it('should display fee information correctly', async () => {
            const { getByText } = await renderFeeOption();

            expect(getByText('4 sat/vB')).toBeTruthy();
            expect(getByText('~ ~10 minutes')).toBeTruthy();
        });

        it.each([
            {
                symbol: 'eth',
                reference: createFeeLevel({ bytes: 0, feeLimit: '1000000' }),
                rate: '10.0000 Gwei',
                amount: /0\.01\s*ETH/,
            },
            {
                symbol: 'btc',
                reference: createFeeLevel({ bytes: 250 }),
                rate: '10 sat/vB',
                amount: /0\.000025\s*BTC/,
            },
        ])(
            'keeps the $symbol estimate visible when the balance cannot cover it',
            async ({ symbol, reference, rate, amount }) => {
                const { getByText, queryByText } = await renderFeeOption({
                    symbol,
                    feeLevel: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                    referenceFeeLevel: reference,
                });

                expect(getByText(rate)).toBeOnTheScreen();
                expect(getByText(amount)).toBeOnTheScreen();
                expect(
                    getByText(
                        `Insufficient ${symbol.toUpperCase()} to cover the current transaction fee.`,
                    ),
                ).toBeOnTheScreen();
                expect(queryByText('Unavailable')).toBeNull();
            },
        );

        it('uses the EIP-1559 maximum rate for an insufficient-balance estimate', async () => {
            mockSelectNetworkFeeLevel.mockReturnValue({
                label: 'normal',
                feePerUnit: '5',
                maxFeePerGas: '10',
                maxPriorityFeePerGas: '1',
                blocks: 2,
            });
            const { getByText } = await renderFeeOption({
                symbol: 'eth',
                feeLevel: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                referenceFeeLevel: createFeeLevel({ bytes: 0, feeLimit: '1000000' }),
            });

            expect(getByText('10.0000 Gwei')).toBeOnTheScreen();
            expect(getByText(/0\.01\s*ETH/)).toBeOnTheScreen();
        });

        it('does not turn a missing transaction size into a zero estimate', async () => {
            const { getByText, queryByText } = await renderFeeOption({
                symbol: 'eth',
                feeLevel: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
            });

            expect(getByText('10.0000 Gwei')).toBeOnTheScreen();
            expect(getByText('Unavailable')).toBeOnTheScreen();
            expect(queryByText(/0\s*ETH/)).toBeNull();
        });

        it.each(['0', '-1', 'NaN'])(
            'does not estimate with an invalid gas limit (%s)',
            async feeLimit => {
                const { getByText, queryByText } = await renderFeeOption({
                    symbol: 'eth',
                    feeLevel: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                    referenceFeeLevel: createFeeLevel({ feeLimit }),
                });

                expect(getByText('Unavailable')).toBeOnTheScreen();
                expect(queryByText(/0\s*ETH/)).toBeNull();
            },
        );

        it.each(['-1', 'NaN'])(
            'does not display an invalid network rate (%s)',
            async feePerUnit => {
                mockSelectNetworkFeeLevel.mockReturnValue({
                    label: 'normal',
                    feePerUnit,
                    blocks: 2,
                });
                const { getByText, queryByText } = await renderFeeOption({
                    symbol: 'eth',
                    feeLevel: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' },
                    referenceFeeLevel: createFeeLevel({ feeLimit: '1000000' }),
                });

                expect(getByText('Unavailable')).toBeOnTheScreen();
                expect(queryByText(/Gwei/)).toBeNull();
            },
        );

        it('rounds an estimated Bitcoin fee up to whole satoshis', async () => {
            mockSelectNetworkFeeLevel.mockReturnValue({
                label: 'normal',
                feePerUnit: '1.1',
                blocks: 2,
            });
            const { getByText } = await renderFeeOption({
                symbol: 'btc',
                feeLevel: { type: 'error', error: 'NOT-ENOUGH-FUNDS' },
                referenceFeeLevel: createFeeLevel({ bytes: 251 }),
            });

            expect(getByText(/0\.00000277\s*BTC/)).toBeOnTheScreen();
        });

        it('does not describe a failed estimate as an insufficient balance', async () => {
            const { getByText, queryByText } = await renderFeeOption({
                symbol: 'eth',
                feeLevel: { type: 'error', error: 'TR_GENERIC_ERROR_TITLE' },
            });

            expect(getByText('Network fee information is unavailable.')).toBeOnTheScreen();
            expect(queryByText('Insufficient balance for this fee.')).toBeNull();
        });

        it('should show radio button when interactive', async () => {
            const { getByTestId } = await renderFeeOption();

            expect(getByTestId('@transactionManagement/fees-level-radio-normal')).toBeTruthy();
        });

        it('should not show radio button when not interactive', async () => {
            const { queryByTestId } = await renderFeeOption({
                isInteractive: false,
            });

            expect(queryByTestId('@transactionManagement/fees-level-radio-normal')).toBeNull();
        });

        it('should show loading skeleton when isLoading is true', async () => {
            const { queryAllByTestId } = await renderFeeOption({
                isLoading: true,
            });

            expect(queryAllByTestId('BoxSkeleton').length).toBeTruthy();
        });
    });

    describe('Interaction', () => {
        it('should call onSelectedFeeLevel when pressed', async () => {
            const { getByTestId } = await renderFeeOption({
                feeKey: 'high',
            });

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-high'));

            expect(mockOnSelectedFeeLevel).toHaveBeenCalledWith('high');
        });

        it('should not call onSelectedFeeLevel when not interactive', async () => {
            const { getByTestId } = await renderFeeOption({
                isInteractive: false,
            });

            await userEvent.press(
                getByTestId('@transactionManagement/fees-level-container-normal'),
            );

            expect(mockOnSelectedFeeLevel).not.toHaveBeenCalled();
        });

        it('should handle different fee levels correctly', async () => {
            const { getByTestId } = await renderFeeOption({
                feeKey: 'economy',
            });

            await userEvent.press(getByTestId('@transactionManagement/fees-level-radio-economy'));

            expect(mockOnSelectedFeeLevel).toHaveBeenCalledWith('economy');
        });
    });

    describe('Fee calculation', () => {
        it('should calculate fee per unit correctly for bitcoin', async () => {
            const { getByText } = await renderFeeOption({
                symbol: 'btc',
                feeLevel: defaultProps.feeLevel,
            });

            // For bitcoin: fee / bytes = 1000 / 250 = 4 sat/vB
            expect(getByText('4 sat/vB')).toBeTruthy();
        });

        it('should use feePerByte for non-bitcoin networks', async () => {
            const { getByText } = await renderFeeOption({
                symbol: 'eth',
                feeLevel: defaultProps.feeLevel,
            });

            expect(getByText('10.0000 Gwei')).toBeTruthy();
        });
    });
});
