import fetch from 'cross-fetch';

import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';

import { getEthereumDefinitions, getEthereumTransactionDefinitions } from './ethereumDefinitions';
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

describe('getEthereumTransactionDefinitions', () => {
    const path = [2147483692, 2147483708, 2147483648, 0, 0];
    const to = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

    beforeEach(() => {
        settingsStore.set(parseConnectSettings({}));
        mockedFetch.mockReset();
        mockedFetch.mockResolvedValue({ status: 404 } as Response);
    });

    it('fetches nothing for a plain ether transfer', async () => {
        await getEthereumTransactionDefinitions({ path, transaction: { chainId: 1, to } });

        expect(getFetchedUrls()).toEqual([]);
    });

    it('fetches the network of a plain transfer on another chain', async () => {
        await getEthereumTransactionDefinitions({ path, transaction: { chainId: 137, to } });

        expect(getFetchedUrls()).toEqual([
            'https://data.trezor.io/firmware/definitions/eth/chain-id/137/network.dat',
        ]);
    });

    it('fetches the token of a contract call by its unprefixed address', async () => {
        await getEthereumTransactionDefinitions({
            path,
            transaction: { chainId: 1, to, data: '0xa9059cbb' },
        });

        expect(getFetchedUrls()).toEqual([
            'https://data.trezor.io/firmware/definitions/eth/chain-id/1/network.dat',
            `https://data.trezor.io/firmware/definitions/eth/chain-id/1/token-${to.slice(2).toLowerCase()}.dat`,
        ]);
    });
});
