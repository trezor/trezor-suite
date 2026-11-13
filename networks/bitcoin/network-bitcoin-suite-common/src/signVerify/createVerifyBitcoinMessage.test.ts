import { type TrezorConnectCallable } from '@trezor/connect-common';
import { createMockDeps, mock } from '@trezor/dependency-injection';

import {
    type VerifyBitcoinMessageDeps,
    createVerifyBitcoinMessage,
} from './createVerifyBitcoinMessage';

const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';

const DEVICE = { path: 'DEVICE_PATH' };

describe(createVerifyBitcoinMessage.name, () => {
    let verifyMessage: jest.MockedFunction<TrezorConnectCallable['verifyMessage']>;
    let deps: VerifyBitcoinMessageDeps;

    beforeEach(() => {
        verifyMessage = mock<TrezorConnectCallable['verifyMessage']>();
        deps = createMockDeps<VerifyBitcoinMessageDeps>({
            getTrezorConnect: () => ({ verifyMessage }),
        });
    });

    const connect = () => ({ verifyMessage });

    describe('hex format', () => {
        it('verifies against the same reading of the message', async () => {
            verifyMessage.mockResolvedValue({ success: true, payload: { message: MESSAGE } });

            await createVerifyBitcoinMessage(deps)({
                device: DEVICE,
                symbol: 'btc',
                address: ADDRESS,
                message: MESSAGE,
                signature: SIGNATURE,
                hex: true,
            });

            expect(connect().verifyMessage).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    address: ADDRESS,
                    message: MESSAGE,
                    signature: SIGNATURE,
                    hex: true,
                }),
            );
        });
    });
});
