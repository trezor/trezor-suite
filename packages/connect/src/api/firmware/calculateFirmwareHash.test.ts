import { DeviceModelInternal } from '@trezor/device-utils';

import { calculateFirmwareHash } from './calculateFirmwareHash';

// NOTE: for unit test purposes create "firmware with empty bytes"
// size doesn't matter, it will be padded by calculateFirmwareHash utility
const bin = Buffer.from('ff', 'hex');

describe('firmware/calculateFirmwareHash', () => {
    it('T1B1 without internal_model', () => {
        expect(
            calculateFirmwareHash({
                // @ts-expect-error - Testing some might be real case when T1B1 does not report internal_model
                internal_model: undefined,
                firmwareVersion: [1, 5, 0],
                fw: bin,
                key: Buffer.from('0123456789abcdef'),
            }),
        ).toStrictEqual({
            hash: 'f5f1097835c9a7c45486230b4f40389a85a4442b5c2c7766e7ca8ef22bf84bd1',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T1B1 with challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T1B1,
                firmwareVersion: [1, 13, 0],
                fw: bin,
                key: Buffer.from('0123456789abcdef'),
            }),
        ).toStrictEqual({
            hash: 'f5f1097835c9a7c45486230b4f40389a85a4442b5c2c7766e7ca8ef22bf84bd1',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T1B1 without challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T1B1,
                firmwareVersion: [1, 13, 0],
                fw: bin,
            }),
        ).toStrictEqual({
            hash: 'a184d460adaac3c059bf2240521b5ff89a6aa6c2a765165d28bee7f4cb9af051',
            challenge: '',
        });
    });

    // T2T1 results from https://github.com/trezor/trezor-firmware/blob/main/core/tests/test_trezor.utils.py
    it('T2T1 with challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T2T1,
                firmwareVersion: [2, 9, 2],
                fw: bin,
                key: Buffer.from('0123456789abcdef'),
            }),
        ).toStrictEqual({
            hash: 'a0934098a680db076ddf7ee22745f119d8fda4601048f05fdb66a64eddc0cfed',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T2T1 without challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T2T1,
                firmwareVersion: [2, 9, 2],
                fw: bin,
            }),
        ).toStrictEqual({
            hash: 'd2db90a76a5636a7004ec3b48e71a955e0cbb2cb5a6fd7ae9fbef846bc166c8c',
            challenge: '',
        });
    });

    it('T3W1 with challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T3W1,
                firmwareVersion: [2, 9, 2],
                fw: bin,
                key: Buffer.from('0123456789abcdef'),
            }),
        ).toStrictEqual({
            hash: '9fb271f171cb9b6a915bac9b62ad80d2319f52dbae7501ddb1d7db43fdfae86f',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T3W1 2.9.3 with challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T3W1,
                firmwareVersion: [2, 9, 3],
                fw: bin,
                key: Buffer.from('0123456789abcdef'),
            }),
        ).toStrictEqual({
            hash: 'd1e3db63003f7fbb01f3f91379f000b4eec38e63f93ea8ab457a5ed71191ff33',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T3W1 without challenge', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T3W1,
                firmwareVersion: [2, 9, 2],
                fw: bin,
            }),
        ).toStrictEqual({
            hash: '6f64d60f29dadd23f0383c51a0c595b4a4d7da952a1f3c7a03de149f1f7a394c',
            challenge: '',
        });
    });

    // just for coverage
    it('no padding', () => {
        expect(
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T2T1,
                firmwareVersion: [2, 9, 2],
                fw: Buffer.alloc(13 * 128 * 1024).fill(bin),
            }),
        ).toStrictEqual({
            hash: 'd2db90a76a5636a7004ec3b48e71a955e0cbb2cb5a6fd7ae9fbef846bc166c8c',
            challenge: '',
        });
    });

    it('T2T1, Firmware too big', () => {
        expect(() =>
            calculateFirmwareHash({
                internal_model: DeviceModelInternal.T2T1,
                firmwareVersion: [2, 9, 2],
                fw: Buffer.alloc(100000000),
            }),
        ).toThrow('Firmware too big');
    });
});
