import '@suite-common/test-utils/globalOverrides';

import { useForm, useWatch } from 'react-hook-form';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { SendContext } from '#src/hooks/wallet/useSendForm';
import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { BaseCurrencyInput } from './BaseCurrencyInput';
import {
    type MockSuiteState,
    mockInitialAppState,
} from '../../../../../../mocks/mockInitialAppState';

const mockEurRate = 2700;

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    updateFiatRatesThunk: () => () =>
        Promise.resolve({
            meta: { requestStatus: 'fulfilled' },
            payload: [{ status: 'fulfilled', value: { rate: mockEurRate } }],
        }),
}));

const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const Harness = () => {
    const methods = useForm<any>({
        defaultValues: {
            outputs: [
                {
                    amount: '0.008',
                    fiat: '24',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                },
            ],
        },
    });
    const [amount, fiat] = useWatch({
        control: methods.control,
        name: ['outputs.0.amount', 'outputs.0.fiat'],
    });

    const value = {
        ...methods,
        account: ethAccount,
        network: getNetwork(ethAccount.symbol),
        getDefaultValue: (fieldName: string, fallback: unknown) =>
            methods.getValues(fieldName) ?? fallback,
        handleFiatChange: jest.fn(),
        composeTransaction: jest.fn(),
    } as any;

    return (
        <SendContext.Provider value={value}>
            <BaseCurrencyInput output={{ fiat: '24' }} outputId={0} />
            <output data-testid="@send/values">{JSON.stringify({ amount, fiat })}</output>
        </SendContext.Provider>
    );
};

describe('BaseCurrencyInput', () => {
    beforeAll(() => {
        Element.prototype.scrollIntoView = jest.fn();
    });

    // Recurring bug: https://github.com/trezor/trezor-suite/issues/33061
    it('keeps the crypto amount and recalculates the fiat amount when the fiat currency changes', async () => {
        const { services } = createTestCompositionRoot<void, MockSuiteState>({
            preloadedState: mockInitialAppState,
        });
        renderWithProviders(services, <Harness />);

        await userEvent.click(screen.getByTestId('outputs.0.currency/input'));
        await userEvent.click(screen.getByTestId('outputs.0.currency/option/eur'));

        await waitFor(() =>
            expect(screen.getByTestId('@send/values')).toHaveTextContent(
                JSON.stringify({ amount: '0.008', fiat: '21.60' }),
            ),
        );
    });
});
