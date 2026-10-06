import { mockGetNamedAddressSupport } from '@suite-common/address/mocks';
import { type AddressValidator, type SymbolNamedAddressResolver } from '@suite-common/networks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';

import {
    type SendFormFormContext,
    type SendOutputsFormValues,
    sendOutputsFormValidationSchema,
} from './sendOutputsFormSchema';

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const btcSymbol = asNetworkSymbol('btc');

const networkFeeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: 0,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [],
};

const formValues = {
    outputs: [
        {
            address: '',
            amount: '',
            fiat: '',
            token: null,
        },
    ],
} satisfies SendOutputsFormValues;

const addressValidator = {
    isAddressValid: (address: string) => EVM_ADDRESS_REGEX.test(address),
    getAddressType: () => 'p2pkh',
} as unknown as AddressValidator;

const namedAddressResolver = {
    supportsNamedAddress: (symbol: string) => symbol === 'eth',
    isNameLike: (value: string) => value.includes('.'),
} as unknown as SymbolNamedAddressResolver;

const getNamedAddressSupport = mockGetNamedAddressSupport(namedAddressResolver);

const resolvedAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

const validateAddress = ({
    address,
    resolvedAddress: outputResolvedAddress,
    symbol = asNetworkSymbol('eth'),
}: {
    address: string;
    resolvedAddress?: string;
    symbol?: SendFormFormContext['symbol'];
}) =>
    sendOutputsFormValidationSchema.validateAt(
        'outputs[0].address',
        { outputs: [{ address, resolvedAddress: outputResolvedAddress }] },
        {
            context: {
                addressValidator,
                symbol,
                namedAddress: getNamedAddressSupport(symbol),
            } satisfies SendFormFormContext,
        },
    );

const createAmountValidationContext = (
    overrides: Partial<SendFormFormContext> = {},
): SendFormFormContext => ({
    symbol: btcSymbol,
    availableBalance: '2000000',
    networkFeeInfo,
    isValueInSats: false,
    isTokenFlow: false,
    decimals: 8,
    ...overrides,
});

const validateEnteredAmount = (enteredAmount: string, context: SendFormFormContext) =>
    sendOutputsFormValidationSchema.validateAt(
        'outputs[0].amount',
        {
            ...formValues,
            outputs: [{ ...formValues.outputs[0], amount: enteredAmount }],
        },
        { context },
    );

describe('sendOutputsFormValidationSchema address', () => {
    it('accepts a hex address', async () => {
        await expect(validateAddress({ address: resolvedAddress })).resolves.toBeDefined();
    });

    it('rejects a malformed hex address', async () => {
        await expect(validateAddress({ address: '0xnotanaddress' })).rejects.toMatchObject({
            message: 'The address format is incorrect.',
        });
    });

    it('accepts a name whose resolution has not settled yet', async () => {
        await expect(validateAddress({ address: 'vitalik.eth' })).resolves.toBeDefined();
    });

    it('accepts a name that resolved to an address', async () => {
        await expect(
            validateAddress({ address: 'vitalik.eth', resolvedAddress }),
        ).resolves.toBeDefined();
    });

    it('rejects a name that failed to resolve', async () => {
        await expect(
            validateAddress({ address: 'vitalik.eth', resolvedAddress: '' }),
        ).rejects.toMatchObject({
            message: 'Could not resolve name. Check that the name is correct.',
        });
    });

    it('rejects a name on a network without named address support', async () => {
        await expect(
            validateAddress({
                address: 'vitalik.eth',
                resolvedAddress,
                symbol: asNetworkSymbol('btc'),
            }),
        ).rejects.toMatchObject({
            message: 'The address format is incorrect.',
        });
    });
});

describe('sendOutputsFormValidationSchema amount', () => {
    it('accepts an amount within the raw balance when fee-adjusted balance is unavailable', async () => {
        await expect(
            validateEnteredAmount(
                '0.00001',
                createAmountValidationContext({
                    networkFeeInfo: undefined,
                    maxSendAmountByFeeLevel: undefined,
                }),
            ),
        ).resolves.toBe('0.00001');
    });

    it('accepts an amount within the raw balance in sats mode', async () => {
        await expect(
            validateEnteredAmount(
                '1000',
                createAmountValidationContext({
                    isValueInSats: true,
                }),
            ),
        ).resolves.toBe('1000');
    });

    it('accepts a token amount within the token balance when network fees are unavailable', async () => {
        await expect(
            validateEnteredAmount(
                '1',
                createAmountValidationContext({
                    availableBalance: '2',
                    nativeCurrencyAvailableBalance: '0',
                    isTokenFlow: true,
                }),
            ),
        ).resolves.toBe('1');
    });

    it('accepts an entered amount below the normal fee-adjusted max send amount', async () => {
        await expect(
            validateEnteredAmount(
                '0.017',
                createAmountValidationContext({
                    maxSendAmountByFeeLevel: {
                        custom: undefined,
                        economy: '0.018',
                        high: '0.017',
                        low: '0.018',
                        normal: '0.018',
                    },
                }),
            ),
        ).resolves.toBe('0.017');
    });

    it('reports insufficient balance when entered amount exceeds the normal fee-adjusted max send amount', async () => {
        await expect(
            validateEnteredAmount(
                '0.019',
                createAmountValidationContext({
                    maxSendAmountByFeeLevel: {
                        custom: undefined,
                        economy: '0.018',
                        high: '0.017',
                        low: '0.018',
                        normal: '0.018',
                    },
                }),
            ),
        ).rejects.toMatchObject({ type: 'is-higher-than-balance' });
    });

    it('reports insufficient balance when entered amount exceeds the raw balance without fee information', async () => {
        await expect(
            validateEnteredAmount(
                '0.021',
                createAmountValidationContext({
                    networkFeeInfo: undefined,
                    maxSendAmountByFeeLevel: undefined,
                }),
            ),
        ).rejects.toMatchObject({ type: 'is-higher-than-balance' });
    });

    it('reports insufficient balance when entered amount exceeds the raw balance in sats mode', async () => {
        await expect(
            validateEnteredAmount(
                '2000001',
                createAmountValidationContext({
                    isValueInSats: true,
                    networkFeeInfo: undefined,
                }),
            ),
        ).rejects.toMatchObject({ type: 'is-higher-than-balance' });
    });

    it('reports insufficient balance when a token amount exceeds the token balance', async () => {
        await expect(
            validateEnteredAmount(
                '3',
                createAmountValidationContext({
                    availableBalance: '2',
                    networkFeeInfo: undefined,
                    isTokenFlow: true,
                }),
            ),
        ).rejects.toMatchObject({ type: 'is-higher-than-balance' });
    });
});
