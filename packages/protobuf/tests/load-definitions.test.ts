import * as ProtoBuf from 'protobufjs/light';

import { loadDefinitions } from '../src/load-definitions';

describe('loadDefinitions', () => {
    const createProtobufRoot = () => {
        return ProtoBuf.Root.fromJSON({
            nested: {
                MessageType: {
                    values: {
                        Initialize: 0,
                    },
                },
            },
        });
    };

    it('merge MessageType enum', async () => {
        const root = createProtobufRoot();
        await loadDefinitions(root, 'bitcoin', () => {
            return Promise.resolve({
                MessageType: {
                    values: {
                        GetAddress: 29,
                    },
                },
            });
        });

        const messageType = root.lookupEnum('MessageType')?.values;
        expect(messageType).toEqual({
            Initialize: 0,
            GetAddress: 29,
        });
    });

    it('throw on merge MessageType enum', async () => {
        const root1 = createProtobufRoot();
        await expect(
            loadDefinitions(root1, 'bitcoin', () => {
                return Promise.resolve({
                    MessageType: {
                        values: {
                            GetAddress: 0,
                        },
                    },
                });
            }),
        ).rejects.toThrow('duplicate id 0');
        expect(root1.lookup('bitcoin')).toBe(null);

        await expect(
            loadDefinitions(createProtobufRoot(), 'bitcoin', () => {
                return Promise.resolve({
                    MessageType: {
                        values: {
                            Initialize: 1,
                        },
                    },
                });
            }),
        ).rejects.toThrow('duplicate name');
    });

    it('create MessageType enum', async () => {
        const root = createProtobufRoot();
        root.remove(root.lookupEnum('MessageType'));

        await loadDefinitions(root, 'bitcoin', () => {
            return Promise.resolve({
                MessageType: {
                    values: {
                        GetAddress: 29,
                    },
                },
            });
        });

        const messageType = root.lookupEnum('MessageType')?.values;
        expect(messageType).toEqual({
            GetAddress: 29,
        });
    });

    it('already loaded', async () => {
        const root = createProtobufRoot();
        root.define('bitcoin', {
            MessageType: {
                values: {
                    GetAddress: 29,
                },
            },
        });

        const spy = jest.fn();
        await loadDefinitions(root, 'bitcoin', spy);

        expect(spy).toHaveBeenCalledTimes(0);
    });
});
