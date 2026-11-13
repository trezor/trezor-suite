import { type TrezorConnectCallable } from '@trezor/connect-common';
import { createMockDeps, mock } from '@trezor/dependency-injection';

import { type SignBitcoinMessageDeps, createSignBitcoinMessage } from './createSignBitcoinMessage';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';

const DEVICE = { path: 'DEVICE_PATH' };

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

    const sign = (hex = false) =>
        createSignBitcoinMessage(deps)({
            device: DEVICE,
            symbol: 'btc',
            path: PATH,
            message: MESSAGE,
            hex,
            format: 'trezor',
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
