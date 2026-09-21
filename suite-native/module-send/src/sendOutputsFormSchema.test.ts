import { mockGetNamedAddressSupport } from '@suite-common/address/mocks';
import { type AddressValidator, type SymbolNamedAddressResolver } from '@suite-common/networks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';

import { type SendFormFormContext, sendOutputsFormValidationSchema } from './sendOutputsFormSchema';

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

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

const networkFeeInfo = {
    blockHeight: 0,
    blockTime: 0,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1', blocks: 1 }],
} satisfies FeeInfo;

type ValidateAmountParams = {
    amount: string;
    context: SendFormFormContext;
};

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

const validateAmount = ({ amount, context }: ValidateAmountParams) =>
    sendOutputsFormValidationSchema.validateAt(
        'outputs[0].amount',
        { outputs: [{ amount }] },
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
    const context = {
        symbol: asNetworkSymbol('btc'),
        availableBalance: '2000000',
        networkFeeInfo,
        isValueInSats: false,
        isTokenFlow: false,
    } satisfies SendFormFormContext;

    it('reports unavailable fees for an amount within the raw balance', async () => {
        await expect(
            validateAmount({
                amount: '0.00001',
                context: {
                    ...context,
                    networkFeeInfo: { ...networkFeeInfo, levels: [] },
                    hasNetworkFeesFetchFailed: true,
                },
            }),
        ).rejects.toMatchObject({
            type: 'are-fees-available',
            message: 'Couldn’t load network fees. Check your connection and try again.',
        });
    });

    it('reports unavailable fees when transaction composition fails', async () => {
        await expect(
            validateAmount({
                amount: '0.00001',
                context: { ...context, hasFeeCompositionFailed: true },
            }),
        ).rejects.toMatchObject({
            type: 'are-fees-available',
            message: 'Insufficient balance to cover the transaction fees.',
        });
    });

    it('reports insufficient balance against the fee-adjusted maximum', async () => {
        await expect(
            validateAmount({
                amount: '0.019',
                context: {
                    ...context,
                    feeLevelsMaxAmount: {
                        custom: undefined,
                        economy: '0.018',
                        high: '0.017',
                        low: '0.018',
                        normal: '0.018',
                    },
                },
            }),
        ).rejects.toMatchObject({
            type: 'is-higher-than-balance',
            message: 'You don’t have enough balance to send this amount.',
        });
    });
});
