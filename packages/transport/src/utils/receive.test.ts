import { v1 } from '@trezor/protocol';
import { PROTOCOL_MALFORMED } from '@trezor/protocol/src/errors';

import { receive } from './receive';
import { success } from './result';

const getReceiver = (hexChunk: string) => () =>
    Promise.resolve(success(Buffer.from(hexChunk, 'hex')));

describe(receive.name, () => {
    it('rejects a declared length above the limit before allocating', async () => {
        const allocSpy = jest.spyOn(Buffer, 'alloc');

        await expect(receive(getReceiver('3f232300027fffffff0a'), v1)).rejects.toThrow(
            PROTOCOL_MALFORMED,
        );
        expect(allocSpy).not.toHaveBeenCalledWith(0x7fffffff);

        allocSpy.mockRestore();
    });

    it('accepts a message of a plausible length', async () => {
        const result = await receive(getReceiver('3f23230002000000060a046d656f77'), v1);

        expect(result).toMatchObject({ success: true, payload: { messageType: 2, length: 6 } });
    });
});
