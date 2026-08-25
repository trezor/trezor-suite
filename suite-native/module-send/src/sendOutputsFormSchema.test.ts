import {
    type AddressValidator,
    type SymbolNamedAddressResolver,
    createGetNamedAddressSupport,
} from '@suite-common/address';
import { type NetworkSymbol } from '@suite-common/networks';
import { mockNetworkModule, mockNetworkModuleRepository } from '@suite-common/networks/mocks';

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

const getNamedAddressSupport = createGetNamedAddressSupport({
    networkModuleRepository: mockNetworkModuleRepository({
        get: <T extends NetworkSymbol>() => mockNetworkModule<T>({ namedAddressResolver }),
    }),
});

const resolvedAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

const validateAddress = ({
    address,
    resolvedAddress: outputResolvedAddress,
    symbol = 'eth',
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
            validateAddress({ address: 'vitalik.eth', resolvedAddress, symbol: 'btc' }),
        ).rejects.toMatchObject({
            message: 'The address format is incorrect.',
        });
    });
});
