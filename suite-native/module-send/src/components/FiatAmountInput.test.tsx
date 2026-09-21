import { yup } from '@suite-common/validators';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Text } from '@suite-native/atoms';
import { Form, useField, useForm } from '@suite-native/forms';
import {
    fireEvent,
    renderWithStoreProvider,
    screen,
    waitFor,
} from '@suite-native/test-utils-store';
import { PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { FiatAmountInput } from './FiatAmountInput';

const ethSymbol = asNetworkSymbol('eth');
const accountKey = mockAccountKey({ symbol: ethSymbol, descriptor: 'eth1' });

const BASE_CURRENCY = 'usd';
const RATE = 1000;
const ETH_DECIMALS = 18;
const EMPTY = '<empty>';

const schema = yup.object({
    outputs: yup.array().of(yup.object({ amount: yup.string(), fiat: yup.string() })),
});

/** Subscribes to the crypto field the same way the real input does, so it re-renders on change. */
const CryptoAmountProbe = () => {
    const { value } = useField({ name: 'outputs.0.amount' });

    return <Text testID="crypto-amount">{value === '' ? EMPTY : value}</Text>;
};

const TestForm = () => {
    const form = useForm({
        validation: schema,
        defaultValues: { outputs: [{ amount: '', fiat: '' }] },
    });

    return (
        <Form form={form}>
            <FiatAmountInput recipientIndex={0} symbol={ethSymbol} accountKey={accountKey} />
            <CryptoAmountProbe />
        </Form>
    );
};

describe('FiatAmountInput', () => {
    const preloadedState = {
        wallet: {
            accounts: [],
            settings: {
                baseCurrency: BASE_CURRENCY,
                bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
                enabledNetworks: [ethSymbol],
            },
            fiat: {
                current: {
                    [getFiatRateKey(ethSymbol, BASE_CURRENCY)]: { rate: RATE },
                },
            },
        },
        tokenDefinitions: {},
    };

    const renderInput = () => renderWithStoreProvider(<TestForm />, { preloadedState });

    it('fills the crypto amount from the entered fiat amount', async () => {
        await renderInput();

        fireEvent.changeText(screen.getByTestId('outputs.0.fiat'), '10');

        await waitFor(() =>
            expect(screen.getByTestId('crypto-amount')).toHaveTextContent(
                new BigNumber(10).div(RATE).toFixed(ETH_DECIMALS),
            ),
        );
    });

    it('clears the crypto amount when the fiat amount is cleared', async () => {
        await renderInput();

        fireEvent.changeText(screen.getByTestId('outputs.0.fiat'), '10');
        await waitFor(() =>
            expect(screen.getByTestId('crypto-amount')).not.toHaveTextContent(EMPTY),
        );

        fireEvent.changeText(screen.getByTestId('outputs.0.fiat'), '');

        await waitFor(() => expect(screen.getByTestId('crypto-amount')).toHaveTextContent(EMPTY));
    });
});
