import fetch from 'cross-fetch';

import EthereumSignTransaction from './ethereumSignTransaction';
import { AAVE_DEPOSIT_ETH_DISPLAY_FORMAT, encodeDefinition } from '../__fixtures__/displayFormat';

jest.mock('cross-fetch');

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

const GATEWAY = '0x721b9abab6511b46b9ee83a1aba23bdacb004149';
const DEPOSIT_ETH_DATA = `0x474cf53d${'00'.repeat(32 * 3)}`;

const mockDefinitionsServer = (displayFormatHex: string) =>
    mockedFetch.mockImplementation(url =>
        Promise.resolve(
            String(url).endsWith(`/display-format/${GATEWAY.slice(2)}-474cf53d.dat`)
                ? ({
                      status: 200,
                      arrayBuffer: () =>
                          Promise.resolve(
                              new Uint8Array(Buffer.from(displayFormatHex, 'hex')).buffer,
                          ),
                  } as Response)
                : ({ status: 404 } as Response),
        ),
    );

const getPrecomposed = async () => {
    const method = new EthereumSignTransaction({
        payload: {
            method: 'ethereumSignTransaction',
            path: "m/44'/60'/0'/0/0",
            transaction: {
                to: GATEWAY,
                value: '0xde0b6b3a7640000',
                gasPrice: '0x1',
                gasLimit: '0x5208',
                nonce: '0x0',
                data: DEPOSIT_ETH_DATA,
                chainId: 100,
            },
        },
    });
    const { precomposed } = await method.getMethodInfo();

    return precomposed as (typeof precomposed & { displayFormat?: unknown }) | undefined;
};

describe('EthereumSignTransaction.getMethodInfo', () => {
    beforeEach(async () => {
        mockedFetch.mockReset();
        mockDefinitionsServer(
            await encodeDefinition('EthereumDisplayFormatInfo', AAVE_DEPOSIT_ETH_DISPLAY_FORMAT),
        );
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
    });

    it('drops a display format served for another chain', async () => {
        mockDefinitionsServer(
            await encodeDefinition('EthereumDisplayFormatInfo', {
                ...AAVE_DEPOSIT_ETH_DISPLAY_FORMAT,
                chain_id: 1,
            }),
        );

        expect((await getPrecomposed())?.displayFormat).toBeUndefined();
    });

    it('previews the call without a display format when none is published', async () => {
        mockedFetch.mockResolvedValue({ status: 404 } as Response);

        const precomposed = await getPrecomposed();

        expect(precomposed).toBeDefined();
        expect(precomposed?.displayFormat).toBeUndefined();
    });
});
