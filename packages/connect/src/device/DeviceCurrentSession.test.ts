import { DeviceCurrentSession } from './DeviceCurrentSession';
import { getLog } from '../utils/debug';

const createSession = () => {
    const sent: { name: string; data: unknown }[] = [];
    const transport = {
        deviceEvents: { once: () => {} },
        call: ({ name, data }: { name: string; data: unknown }) => {
            sent.push({ name, data });

            return Promise.resolve({
                success: true,
                payload: { type: 'Success', message: { message: '' } },
            });
        },
    };
    const device = { transportPath: 'path', getThpState: () => undefined };
    const session = new DeviceCurrentSession(device as never, transport as never, '1' as never);

    return { session, sent };
};

const getLoggedText = () => JSON.stringify(getLog().map(({ message }) => message));

describe('DeviceCurrentSession device-call log', () => {
    it.each([
        ['PinMatrixAck', { pin: 'secret-value' }],
        ['WordAck', { word: 'secret-value' }],
        ['ThpCreateNewSession', { passphrase: 'secret-value' }],
        ['CipherKeyValue', { address_n: [], key: 'key-name', value: 'secret-value' }],
        ['LoadDevice', { mnemonics: ['secret-value'], pin: 'secret-value' }],
    ])('redacts %s but sends it to the device intact', async (name, data) => {
        const { session, sent } = createSession();

        await session.call(name as never, data as never);

        expect(sent).toEqual([expect.objectContaining({ name, data })]);
        expect(getLoggedText()).toContain(name);
        expect(getLoggedText()).not.toContain('secret-value');
    });
});
