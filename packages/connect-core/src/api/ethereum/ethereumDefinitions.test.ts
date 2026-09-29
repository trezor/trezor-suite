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
            'https://data.trezor.io/firmware/definitions/v1/eth/chain-id/1/network.dat',
            `https://data.trezor.io/firmware/definitions/v1/eth/chain-id/1/token-${lowerCaseContractAddress}.dat`,
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

    it.each([1, 2] as const)(
        'fetches v%s definitions from the development channel',
        async version => {
            settingsStore.set(parseConnectSettings({ definitionsChannel: 'development' }));

            await getEthereumDefinitions({ slip44: 60, version });

            expect(getFetchedUrls()).toEqual([
                `https://dev.firmware.sldev.cz/definitions/v${version}/eth/slip44/60/network.dat`,
            ]);
        },
    );
});
