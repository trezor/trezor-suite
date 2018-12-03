import fs from 'fs';
import { getLatestSafeFw } from 'index';

const T1Releases = fs.readFileSync('./src/test/data/webwallet-data/firmware/1/releases.json', 'utf8');
const T2Releases = fs.readFileSync('./src/test/data/webwallet-data/firmware/2/releases.json', 'utf8');

describe('getLatestSafeFw()', () => {
    it('should not return latest fw if it has bootloader version higher than bl version of device', () => {
        const result = getLatestSafeFw({
            releases: T1Releases,
            trezorModel: 'T1',
            firmwareVersion: '1.6.2',
            isBeta: false,
        });
        expect(result).toBe(true);
    });
});
