import fetch from 'cross-fetch';

import { DeviceModelInternal, VersionArray } from '@trezor/device-utils';

import EthereumGetAddress from './api/ethereumGetAddress';
import EthereumSignMessage from './api/ethereumSignMessage';
import EthereumSignTransaction from './api/ethereumSignTransaction';
import EthereumSignTypedData from './api/ethereumSignTypedData';
import { getDefinitionsVersion, getEthereumDefinitions } from './ethereumDefinitions';

jest.mock('cross-fetch');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const definitionV1 = new Uint8Array([1]).buffer;
const definitionV2 = new Uint8Array([2]).buffer;
const path = [44 | 0x80000000, 60 | 0x80000000, 0x80000000, 0, 0];

const getFetchedUrls = () => mockedFetch.mock.calls.map(([url]) => url);

type MethodCase = {
    name: string;
    createMethod: () => any;
    getSentDefinition: (typedCall: jest.Mock, getAddress: jest.Mock) => unknown;
};

const createMethod = (Method: any, methodName: string, params: unknown) => {
    const method = new Method({ id: 1, payload: { method: methodName } });
    method.params = params;

    return method;
};

const definitions = { encoded_network: definitionV1 };

const methods: MethodCase[] = [
    {
        name: 'ethereumSignMessage',
        createMethod: () =>
            createMethod(EthereumSignMessage, 'ethereumSignMessage', {
                address_n: path,
                message: 'aa',
                definitions,
            }),
        getSentDefinition: typedCall => typedCall.mock.calls[0][2].encoded_network,
    },
    {
        name: 'ethereumSignTypedData',
        createMethod: () =>
            createMethod(EthereumSignTypedData, 'ethereumSignTypedData', {
                address_n: path,
                domain_separator_hash: 'aa',
                data: { types: {}, primaryType: 'Message', domain: {}, message: {} },
                definitions,
            }),
        getSentDefinition: typedCall => {
            const message = typedCall.mock.calls[0][2];

            return message.encoded_network ?? message.definitions?.encoded_network;
        },
    },
    {
        name: 'ethereumGetAddress',
        createMethod: () =>
            createMethod(EthereumGetAddress, 'ethereumGetAddress', [
                { address_n: path, show_display: false, encoded_network: definitionV1 },
            ]),
        getSentDefinition: (_typedCall, getAddress) => getAddress.mock.calls[0][0].encoded_network,
    },
    {
        name: 'ethereumSignTransaction',
        createMethod: () =>
            createMethod(EthereumSignTransaction, 'ethereumSignTransaction', {
                path,
                type: 'legacy',
                tx: {
                    to: '0x7314e0f1c0e28474bdb6be3e2c3e0453255188f8',
                    value: '0x0',
                    gasLimit: '0x5208',
                    gasPrice: '0x1',
                    nonce: '0x0',
                    chainId: 2020,
                },
                definitions,
            }),
        getSentDefinition: typedCall => typedCall.mock.calls[0][2].definitions.encoded_network,
    },
];

const runWithFirmware = async (method: any, firmwareVersion: VersionArray) => {
    const typedCall = jest.fn().mockRejectedValue(new Error('stop'));
    const getAddress = jest.fn().mockRejectedValue(new Error('stop'));
    method.device = {
        getVersion: () => firmwareVersion,
        getCommands: () => ({ typedCall, ethereumGetAddress: getAddress }),
        features: {
            internal_model:
                firmwareVersion[0] === 1 ? DeviceModelInternal.T1B1 : DeviceModelInternal.T2T1,
        },
    };

    await expect(method.run()).rejects.toThrow('stop');

    return { typedCall, getAddress };
};

describe('ethereum definitions', () => {
    beforeEach(() => {
        mockedFetch.mockReset();
        mockedFetch.mockImplementation(url =>
            Promise.resolve({
                status: 200,
                arrayBuffer: () =>
                    Promise.resolve(String(url).includes('/v2/') ? definitionV2 : definitionV1),
            } as Response),
        );
    });

    describe(getDefinitionsVersion.name, () => {
        it.each([
            [[1, 14, 1], 1],
            [[1, 14, 2], 2],
            [[1, 15, 0], 2],
            [[2, 12, 5], 1],
            [[2, 13, 0], 2],
            [undefined, 1],
        ] as const)('firmware %s uses definitions v%s', (firmwareVersion, expected) => {
            expect(getDefinitionsVersion(firmwareVersion as VersionArray | undefined)).toBe(
                expected,
            );
        });
    });

    describe(getEthereumDefinitions.name, () => {
        const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
        const lowerCaseContractAddress = contractAddress.toLowerCase();

        it('downloads v1 definitions by default', async () => {
            await getEthereumDefinitions({ chainId: 1, contractAddress });

            expect(getFetchedUrls()).toEqual([
                'https://data.trezor.io/firmware/eth-definitions/chain-id/1/network.dat',
                `https://data.trezor.io/firmware/eth-definitions/chain-id/1/token-${lowerCaseContractAddress}.dat`,
            ]);
        });

        it('downloads v2 definitions', async () => {
            await getEthereumDefinitions({ chainId: 1, contractAddress, version: 2 });

            expect(getFetchedUrls()).toEqual([
                'https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/network.dat',
                `https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/token-${lowerCaseContractAddress}.dat`,
            ]);
        });
    });

    describe.each(methods)('$name', ({ createMethod: create, getSentDefinition }) => {
        it.each([[[1, 14, 2]], [[2, 13, 0]]] as VersionArray[][])(
            'sends v2 definition to firmware %s',
            async firmwareVersion => {
                const { typedCall, getAddress } = await runWithFirmware(create(), firmwareVersion);

                expect(getSentDefinition(typedCall, getAddress)).toBe(definitionV2);
            },
        );

        it.each([[[1, 14, 1]], [[2, 12, 5]]] as VersionArray[][])(
            'keeps v1 definition for firmware %s',
            async firmwareVersion => {
                const { typedCall, getAddress } = await runWithFirmware(create(), firmwareVersion);

                expect(getSentDefinition(typedCall, getAddress)).toBe(definitionV1);
                expect(mockedFetch).not.toHaveBeenCalled();
            },
        );

        it('does not send the v1 definition when v2 download fails', async () => {
            mockedFetch.mockRejectedValue(new Error('offline'));
            jest.spyOn(console, 'warn').mockImplementation(() => {});

            const { typedCall, getAddress } = await runWithFirmware(create(), [1, 14, 2]);

            expect(getSentDefinition(typedCall, getAddress)).toBeUndefined();
        });
    });
});
