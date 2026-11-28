import { type TrezorConnectCallable, asDeviceUniquePath } from '@trezor/connect-common';
import { createMockDeps, mock } from '@trezor/dependency-injection';

import { type BitcoinSignatureFormat } from './bitcoinSignatureFormats';
import { type SignBitcoinMessageDeps, createSignBitcoinMessage } from './createSignBitcoinMessage';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';

const DEVICE = { path: asDeviceUniquePath('DEVICE_PATH') };

describe(createSignBitcoinMessage.name, () => {
    let signMessage: jest.MockedFunction<TrezorConnectCallable['signMessage']>;
    let deps: SignBitcoinMessageDeps;

    beforeEach(() => {
        signMessage = mock<TrezorConnectCallable['signMessage']>();
        deps = createMockDeps<SignBitcoinMessageDeps>({
            getTrezorConnect: () => ({ signMessage }),
        });
    });

    const connect = () => ({ signMessage });

    const sign = (hex = false, format: BitcoinSignatureFormat = 'trezor') =>
        createSignBitcoinMessage(deps)('btc', {
            device: DEVICE,
            path: PATH,
            message: MESSAGE,
            hex,
            format,
        });

    it.each([
        { format: 'trezor', noScriptType: false },
        { format: 'electrum', noScriptType: true },
    ] as const)('signs with the selected $format format', async ({ format, noScriptType }) => {
        signMessage.mockResolvedValue({
            success: true,
            payload: { address: ADDRESS, signature: SIGNATURE },
        });

        await sign(false, format);

        expect(signMessage).toHaveBeenCalledWith(
            expect.objectContaining({ no_script_type: noScriptType }),
        );
    });

    describe('hex format', () => {
        it('hands the message to the device as hex when the switch is on', async () => {
            signMessage.mockResolvedValue({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign(true);

            expect(connect().signMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({ message: MESSAGE, hex: true, no_script_type: false }),
            );
        });

        it('hands it over as text when the switch is off', async () => {
            signMessage.mockResolvedValue({
                success: true,
                payload: { address: ADDRESS, signature: SIGNATURE },
            });

            await sign();

            expect(connect().signMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({ message: MESSAGE, hex: false }),
            );
        });
    });
});
