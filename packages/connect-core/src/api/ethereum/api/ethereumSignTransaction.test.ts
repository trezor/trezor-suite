import fetch from 'cross-fetch';
import { encodeFunctionData, parseAbi } from 'viem';

import EthereumSignTransaction from './ethereumSignTransaction';
import {
    AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
    MULTICALL_DISPLAY_FORMAT,
    SWEEP_DISPLAY_FORMAT,
    encodeDefinition,
} from '../__fixtures__/displayFormat';

jest.mock('cross-fetch');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const GATEWAY = '0x721b9abab6511b46b9ee83a1aba23bdacb004149';
const DEPOSIT_ETH_DATA = `0x474cf53d${'00'.repeat(32 * 3)}`;

const MULTICALL = '0x66a9893cc07d91d95644aedd05d03f95e1dba8af';
const SWEEP_DATA = '01681a62000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
// multicall([sweep(USDC), sweep(USDC), 0x0102]): the repeated call and the call too short to
// hold a selector need no download.
const MULTICALL_DATA = [
    '0xac9650d8',
    '0000000000000000000000000000000000000000000000000000000000000020',
    '0000000000000000000000000000000000000000000000000000000000000003',
    '0000000000000000000000000000000000000000000000000000000000000060',
    '00000000000000000000000000000000000000000000000000000000000000c0',
    '0000000000000000000000000000000000000000000000000000000000000120',
    '0000000000000000000000000000000000000000000000000000000000000024',
    SWEEP_DATA.padEnd(128, '0'),
    '0000000000000000000000000000000000000000000000000000000000000024',
    SWEEP_DATA.padEnd(128, '0'),
    '0000000000000000000000000000000000000000000000000000000000000002',
    '0102'.padEnd(64, '0'),
].join('');

const encodeMulticall = (calls: `0x${string}`[]) =>
    encodeFunctionData({ abi: parseAbi(['function multicall(bytes[] data)']), args: [calls] });

const getDisplayFormatRequests = () =>
    mockedFetch.mock.calls.filter(([url]) => String(url).includes('/display-format/'));

// Serves the given `<address>-<selector>` display formats; anything else is not published.
const mockDefinitionsServer = (displayFormats: Record<string, string>) =>
    mockedFetch.mockImplementation(url => {
        const [, call] = String(url).match(/\/display-format\/(\w+-\w+)\.dat$/) ?? [];
        const displayFormatHex = call && displayFormats[call];

        return Promise.resolve(
            displayFormatHex
                ? ({
                      status: 200,
                      arrayBuffer: () =>
                          Promise.resolve(
                              new Uint8Array(Buffer.from(displayFormatHex, 'hex')).buffer,
                          ),
                  } as Response)
                : ({ status: 404 } as Response),
        );
    });

const getPrecomposed = async ({ to = GATEWAY, data = DEPOSIT_ETH_DATA } = {}) => {
    const method = new EthereumSignTransaction({
        payload: {
            method: 'ethereumSignTransaction',
            path: "m/44'/60'/0'/0/0",
            transaction: {
                to,
                value: '0xde0b6b3a7640000',
                gasPrice: '0x1',
                gasLimit: '0x5208',
                nonce: '0x0',
                data,
                chainId: 100,
            },
        },
    });
    const { precomposed } = await method.getMethodInfo();

    return precomposed as
        | (typeof precomposed & { displayFormat?: unknown; subcallDisplayFormats?: unknown })
        | undefined;
};

describe('EthereumSignTransaction.getMethodInfo', () => {
    beforeEach(async () => {
        mockedFetch.mockReset();
        mockDefinitionsServer({
            [`${GATEWAY.slice(2)}-474cf53d`]: await encodeDefinition(
                'EthereumDisplayFormatInfo',
                AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
            ),
        });
    });

    it('previews the call with the display format the device will request', async () => {
        const precomposed = await getPrecomposed();

        expect(mockedFetch).toHaveBeenCalledWith(
            expect.stringMatching(
                /\/chain-id\/100\/display-format\/721b9abab6511b46b9ee83a1aba23bdacb004149-474cf53d\.dat$/,
            ),
        );
        expect(precomposed?.displayFormat).toMatchObject({
            chainId: 100,
            address: GATEWAY,
            functionSignature: '0x474cf53d',
            intent: 'Supply',
            providerName: 'Aave',
        });
        expect(precomposed?.subcallDisplayFormats).toEqual([]);
    });

    it('drops a display format served for another chain', async () => {
        mockDefinitionsServer({
            [`${GATEWAY.slice(2)}-474cf53d`]: await encodeDefinition('EthereumDisplayFormatInfo', {
                ...AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
                chain_id: 1,
            }),
        });

        expect((await getPrecomposed())?.displayFormat).toBeUndefined();
    });

    it('previews the call without a display format when none is published', async () => {
        mockedFetch.mockResolvedValue({ status: 404 } as Response);

        const precomposed = await getPrecomposed();

        expect(precomposed).toBeDefined();
        expect(precomposed?.displayFormat).toBeUndefined();
    });

    it('downloads the display formats of the calls the transaction embeds, once per call', async () => {
        mockDefinitionsServer({
            [`${MULTICALL.slice(2)}-ac9650d8`]: await encodeDefinition(
                'EthereumDisplayFormatInfo',
                MULTICALL_DISPLAY_FORMAT,
            ),
            [`${MULTICALL.slice(2)}-01681a62`]: await encodeDefinition(
                'EthereumDisplayFormatInfo',
                SWEEP_DISPLAY_FORMAT,
            ),
        });

        const precomposed = await getPrecomposed({ to: MULTICALL, data: MULTICALL_DATA });

        expect(precomposed?.subcallDisplayFormats).toEqual([
            expect.objectContaining({
                chainId: 100,
                address: MULTICALL,
                functionSignature: '0x01681a62',
                intent: 'Sweep',
            }),
        ]);
        expect(getDisplayFormatRequests()).toHaveLength(2);
    });

    describe('embedded calls', () => {
        beforeEach(async () => {
            mockDefinitionsServer({
                [`${MULTICALL.slice(2)}-ac9650d8`]: await encodeDefinition(
                    'EthereumDisplayFormatInfo',
                    MULTICALL_DISPLAY_FORMAT,
                ),
            });
        });

        it('downloads nothing for a call the device decodes with a built-in definition', async () => {
            const transfer = `0xa9059cbb${'00'.repeat(64)}` as const;

            await getPrecomposed({ to: MULTICALL, data: encodeMulticall([transfer]) });

            expect(getDisplayFormatRequests()).toHaveLength(1);
        });

        it('downloads the definitions of at most 10 calls before the user confirms', async () => {
            const calls = Array.from(
                { length: 12 },
                (_, index) => `0x10${index.toString(16).padStart(6, '0')}` as const,
            );

            await getPrecomposed({ to: MULTICALL, data: encodeMulticall(calls) });

            // The transaction's own definition, then the capped embedded ones.
            expect(getDisplayFormatRequests()).toHaveLength(1 + 10);
        });
    });

    it('drops an embedded call display format served for another contract', async () => {
        mockDefinitionsServer({
            [`${MULTICALL.slice(2)}-ac9650d8`]: await encodeDefinition(
                'EthereumDisplayFormatInfo',
                MULTICALL_DISPLAY_FORMAT,
            ),
            [`${MULTICALL.slice(2)}-01681a62`]: await encodeDefinition(
                'EthereumDisplayFormatInfo',
                { ...SWEEP_DISPLAY_FORMAT, address: GATEWAY.slice(2) },
            ),
        });

        const precomposed = await getPrecomposed({ to: MULTICALL, data: MULTICALL_DATA });

        expect(precomposed?.displayFormat).toBeDefined();
        expect(precomposed?.subcallDisplayFormats).toEqual([]);
    });
});
