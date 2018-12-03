import fs from 'fs';
import TrezorUpdate from '../index';

const T1Releases = fs.readFileSync('./src/test/data/webwallet-data/firmware/1/releases.json', 'utf8');
const T2Releases = fs.readFileSync('./src/test/data/webwallet-data/firmware/2/releases.json', 'utf8');

describe('get latest safe firmware verzion for TREZOR 1', () => {
    it('trezor without firmware', () => {
        const result = TrezorUpdate.getLatestSafeFw({
            releasesJson: T1Releases,
            bootloaderMode: true,
            hasFirmware: true,
            firmwareVersion: '1.2.3',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
        });
        expect(result).toBe('something');
    });
});

describe('get latest safe firmware verzion for TREZOR 2', () => {
    it('trezor without firmware', () => {
        const result = TrezorUpdate.getLatestSafeFw({
            releasesJson: T2Releases,
            bootloaderMode: true,
            hasFirmware: true,
            firmwareVersion: '1.2.3',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36',
        });
        expect(result).toBe('something');
    });
});
