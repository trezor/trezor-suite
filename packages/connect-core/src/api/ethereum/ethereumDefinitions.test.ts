import fetch from 'cross-fetch';

import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { MessagesSchema } from '@trezor/protobuf';

import { AAVE_DEPOSIT_ETH_DISPLAY_FORMAT, encodeDefinition } from './__fixtures__/displayFormat';
import { decodeEthereumDisplayFormat, getEthereumDefinitions } from './ethereumDefinitions';
import * as settingsStore from '../../data/settingsStore';

jest.mock('cross-fetch');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const getFetchedUrls = () => mockedFetch.mock.calls.map(([url]) => url);

describe('getEthereumDefinitions', () => {
    const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const lowerCaseContractAddress = contractAddress.toLowerCase();

    beforeEach(() => {
        mockedFetch.mockReset();
        mockedFetch.mockResolvedValue({ status: 404 } as Response);
    });

    it('fetches v1 definitions from the production channel by default', async () => {
        await getEthereumDefinitions({ chainId: 1, contractAddress });

        expect(getFetchedUrls()).toEqual([
            'https://data.trezor.io/firmware/definitions/eth/chain-id/1/network.dat',
            `https://data.trezor.io/firmware/definitions/eth/chain-id/1/token-${lowerCaseContractAddress}.dat`,
        ]);
    });

    it('fetches v2 definitions from the production channel', async () => {
        await getEthereumDefinitions({
            chainId: 1,
            contractAddress,
            functionSignature: 'A9059CBB',
            version: 2,
        });

        expect(getFetchedUrls()).toEqual([
            'https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/network.dat',
            `https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/token-${lowerCaseContractAddress}.dat`,
            `https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/display-format/${lowerCaseContractAddress}-a9059cbb.dat`,
        ]);
    });

    it.each([
        [1, 'development'],
        [2, 'development'],
        [1, 'signed'],
        [2, 'signed'],
    ] as const)(
        'fetches v%s definitions from the development channel',
        async (version, definitionsChannel) => {
            settingsStore.set(parseConnectSettings({ definitionsChannel }));

            await getEthereumDefinitions({ slip44: 60, version });

            const signedOrUnsigned = definitionsChannel === 'signed' ? 'signed' : 'unsigned';

            expect(getFetchedUrls()).toEqual([
                `https://dev.firmware.sldev.cz/${signedOrUnsigned}/v${version}/definitions/eth/slip44/60/network.dat`,
            ]);
        },
    );
});

describe('decodeEthereumDisplayFormat', () => {
    it('decodes a display-format definition', async () => {
        const encoded = await encodeDefinition(
            'EthereumDisplayFormatInfo',
            AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
        );

        expect(decodeEthereumDisplayFormat(encoded)).toEqual({
            chainId: 100,
            address: '0x721b9abab6511b46b9ee83a1aba23bdacb004149',
            functionSignature: '0x474cf53d',
            intent: 'Supply',
            providerName: 'Aave',
            parameters: [
                { type: 'atomic', abiType: 'ABI_ADDRESS' },
                { type: 'atomic', abiType: 'ABI_ADDRESS' },
                { type: 'atomic', abiType: 'ABI_UINT16' },
            ],
            fields: [
                {
                    label: 'Amount to supply',
                    formatter: 'FORMATTER_AMOUNT',
                    path: { type: 'container', container: 'VALUE' },
                    nativeCurrencyAddresses: [],
                    enumValues: [],
                },
                {
                    label: 'Collateral recipient',
                    formatter: 'FORMATTER_ADDRESS_NAME',
                    path: { type: 'data', steps: [1] },
                    nativeCurrencyAddresses: [],
                    enumValues: [],
                },
            ],
        });
    });

    it('decodes nested ABI types, slices and token options', async () => {
        const encoded = await encodeDefinition('EthereumDisplayFormatInfo', {
            ...AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
            provider_name: undefined,
            parameter_definitions: [
                { tuple: { fields: [{ atomic: 1 }, { dynamic: 30 }], is_dynamic: true } },
                { array: { atomic: 0 } },
            ],
            field_definitions: [
                {
                    path: { path: [0, -1], slice_start: -20 },
                    label: 'Amount',
                    formatter: 2,
                    token_path: { path: [1, 0] },
                    threshold: '00ff',
                    threshold_message: 'All',
                    native_currency_address: ['eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
                    enum_values: [],
                },
                {
                    path: { path: [], const_value: 'v3' },
                    label: 'Version',
                    formatter: 4,
                    native_currency_address: [],
                    enum_values: [],
                },
                {
                    path: { path: [0], slice_end: 4 },
                    label: 'Selector',
                    formatter: 4,
                    native_currency_address: [],
                    enum_values: [],
                },
            ],
        });

        expect(decodeEthereumDisplayFormat(encoded)).toMatchObject({
            providerName: undefined,
            parameters: [
                {
                    type: 'tuple',
                    fields: [
                        { type: 'atomic', abiType: 'ABI_UINT256' },
                        { type: 'dynamic', abiType: 'ABI_BYTES' },
                    ],
                },
                { type: 'array', element: { type: 'atomic', abiType: 'ABI_ADDRESS' } },
            ],
            fields: [
                {
                    path: { type: 'data', steps: [0, -1], slice: { start: -20 } },
                    formatter: 'FORMATTER_TOKEN_AMOUNT',
                    tokenPath: { type: 'data', steps: [1, 0] },
                    threshold: '0x00ff',
                    thresholdMessage: 'All',
                    nativeCurrencyAddresses: ['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
                },
                { path: { type: 'const', value: 'v3' }, formatter: 'FORMATTER_RAW' },
                { path: { type: 'data', steps: [0], slice: { start: 0, end: 4 } } },
            ],
        });
    });

    it('rejects a definition of another type', async () => {
        const encoded = await encodeDefinition(
            'EthereumDisplayFormatInfo',
            AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
            MessagesSchema.DefinitionType.ETHEREUM_TOKEN,
        );

        expect(() => decodeEthereumDisplayFormat(encoded)).toThrow('unexpected definition type');
    });
});
