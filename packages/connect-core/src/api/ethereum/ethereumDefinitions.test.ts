import fetch from 'cross-fetch';

import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';

import { getEthereumDefinitions } from './ethereumDefinitions';
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
        await getEthereumDefinitions({ chainId: 1, contractAddress, version: 2 });

        expect(getFetchedUrls()).toEqual([
            'https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/network.dat',
            `https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/token-${lowerCaseContractAddress}.dat`,
        ]);
    });

    describe('with function signature', () => {
        const displayFormatUrl = (functionSignature: string) =>
            `https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/display-format/${lowerCaseContractAddress}-${functionSignature}.dat`;
        const networkUrl =
            'https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/network.dat';
        const tokenUrl = `https://data.trezor.io/firmware/definitions/v2/eth/chain-id/1/token-${lowerCaseContractAddress}.dat`;

        const mockFoundUrls = (foundUrls: string[]) =>
            mockedFetch.mockImplementation(url =>
                Promise.resolve(
                    (foundUrls.includes(url as string)
                        ? {
                              status: 200,
                              arrayBuffer: () => Promise.resolve(new Uint8Array([1]).buffer),
                          }
                        : { status: 404 }) as Response,
                ),
            );

        it.each(['A9059CBB', '00000000'])(
            'returns only the display format when found for %s',
            async functionSignature => {
                const lowerCaseFunctionSignature = functionSignature.toLowerCase();
                mockFoundUrls([displayFormatUrl(lowerCaseFunctionSignature), networkUrl, tokenUrl]);

                const definitions = await getEthereumDefinitions({
                    chainId: 1,
                    contractAddress,
                    functionSignature,
                    version: 2,
                });

                expect(getFetchedUrls()).toEqual([displayFormatUrl(lowerCaseFunctionSignature)]);
                expect(definitions).toEqual({ encoded_display_format: '01' });
            },
        );

        it('returns no definitions when the display format is not found', async () => {
            mockFoundUrls([networkUrl, tokenUrl]);

            const definitions = await getEthereumDefinitions({
                chainId: 1,
                contractAddress,
                functionSignature: 'A9059CBB',
                version: 2,
            });

            expect(getFetchedUrls()).toEqual([displayFormatUrl('a9059cbb')]);
            expect(definitions).toEqual({});
        });

        it('falls back to the network and token for a contract name request', async () => {
            mockFoundUrls([networkUrl, tokenUrl]);

            const definitions = await getEthereumDefinitions({
                chainId: 1,
                contractAddress,
                functionSignature: '00000000',
                version: 2,
            });

            expect(getFetchedUrls()).toEqual([displayFormatUrl('00000000'), networkUrl, tokenUrl]);
            expect(definitions).toEqual({
                encoded_network: expect.any(ArrayBuffer),
                encoded_token: expect.any(ArrayBuffer),
            });
        });
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
                `https://dev.firmware.sldev.cz/definitions/${signedOrUnsigned}/v${version}/eth/slip44/60/network.dat`,
            ]);
        },
    );
});
