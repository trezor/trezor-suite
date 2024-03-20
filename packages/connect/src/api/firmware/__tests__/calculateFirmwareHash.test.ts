import { calculateFirmwareHash } from '../calculateFirmwareHash';

// NOTE: for unit test purposes create "firmware with empty bytes"
// size doesn't matter, it will be padded by calculateFirmwareHash utility
const bin = Buffer.from('ff', 'hex');

describe('firmware/calculateFirmwareHash', () => {
    it('T1B1 with challenge', () => {
        expect(calculateFirmwareHash(1, bin, Buffer.from('0123456789abcdef'))).toStrictEqual({
            hash: 'f5f1097835c9a7c45486230b4f40389a85a4442b5c2c7766e7ca8ef22bf84bd1',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T1B1 without challenge', () => {
        expect(calculateFirmwareHash(1, bin)).toStrictEqual({
            hash: 'a184d460adaac3c059bf2240521b5ff89a6aa6c2a765165d28bee7f4cb9af051',
            challenge: '',
        });
    });

    // T2T1 results from https://github.com/trezor/trezor-firmware/blob/main/core/tests/test_trezor.utils.py
    it('T2T1 with challenge', () => {
        expect(calculateFirmwareHash(2, bin, Buffer.from('0123456789abcdef'))).toStrictEqual({
            hash: 'a0934098a680db076ddf7ee22745f119d8fda4601048f05fdb66a64eddc0cfed',
            challenge: '30313233343536373839616263646566',
        });
    });

    it('T2T1 without challenge', () => {
        expect(calculateFirmwareHash(2, bin)).toStrictEqual({
            hash: 'd2db90a76a5636a7004ec3b48e71a955e0cbb2cb5a6fd7ae9fbef846bc166c8c',
            challenge: '',
        });
    });

    // just for coverage
    it('no padding', () => {
        expect(calculateFirmwareHash(2, Buffer.alloc(13 * 128 * 1024).fill(bin))).toStrictEqual({
            hash: 'd2db90a76a5636a7004ec3b48e71a955e0cbb2cb5a6fd7ae9fbef846bc166c8c',
            challenge: '',
        });
    });

    it('Firmware too big', () => {
        expect(() => calculateFirmwareHash(2, Buffer.alloc(100000000))).toThrowError(
            'Firmware too big',
        );
    });
});
