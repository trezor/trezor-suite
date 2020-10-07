/* eslint-disable global-require */

import fs from 'fs';
import {
    encrypt,
    decrypt,
    deriveMetadataKey,
    deriveAesKey,
    deriveFilename,
    arrayBufferToBuffer,
    urlSearchParams,
} from '../metadata';

const filename = '828652b66f2e6f919fbb7fe4c9609d4891ed531c6fac4c28441e53ebe577ac85';
// m/49'/0'/0' first segwit account
const xpub =
    'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx';

const originalJson = {
    version: '1.0.0',
    accountLabel: '<script>alert(1);</scipt',
    outputLabels: {
        daff93b559df5dcfd3157ef46e16af9397880c49f304b843f82e6815ffefcb00: { '0': 'piojpioj' },
        a6e9698f9593f669ffe87adb6dd676984ed8519da277878e755982685be74b95: { '0': 'jpoijpoij' },
        '782b440a78c5f5756e541ae74ca1f1308f3fd4a3c0ec1180cca2e7b51b44b51d': {
            '0': 'LABEL LABEL LABEL LABEL LABEL LABEL LABEL',
        },
        a8cd79995ffc611fffa2733d010111c782c3d271470f61ffaffaf69dbbd25b2a: {
            '0': '<s>bla {{ 1+1}}',
        },
        '9833fe567f281380772c6347e80388308c684458302149815b5e5be099b404e4': { '0': 'mkm' },
    },
    addressLabels: {
        '3DDEgt7quAq7XqoG6PjVXi1eeAea4rfWck': 'adres label',
        '3AAVuCwY14GhZxneLdnyyHVnbxrnybvfLG': '1515',
        '34DbTn7C2EpCT9PGwAZ34nEQqm417rdjs9': 'adresa bla',
        '38dN4pKoM5xj7Ng3x77MQjTzFu5pGfao1k': 'kji',
    },
};

describe('metadata', () => {
    it('decrypt real file data from dropbox', async () => {
        // require('trezor-connect');

        const file = fs.readFileSync(`./src/utils/suite/__fixtures__/${filename}.mtdt`);

        // deriveMetadataKey
        const metadataKey = deriveMetadataKey(
            '20c8bf0701213cdcf4c2f56fd0096c1772322d42fb9c4d0ddf6bb122d713d2f3',
            xpub,
        );
        expect(metadataKey).toEqual('2qNGNf2h38GRRbD8FvYTMEVWajMZKt9oecaQAoGZT2FsuLZuBR');

        // deriveFile name
        expect(deriveFilename(metadataKey)).toEqual(filename);

        // deriveAesKey
        const aesKey = deriveAesKey(metadataKey);
        expect(aesKey).toEqual('9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480');

        // decrypt
        const decrypted = decrypt(file, Buffer.from(aesKey, 'hex'));

        expect(decrypted).toEqual(originalJson);

        // after new round of encryption, resulting data differ from the original
        const encryptedAgain = await encrypt(
            decrypted,
            '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
        );
        expect(encryptedAgain).not.toEqual(file);

        // but when decrypted again, original json appears;
        const againDecrypted = await decrypt(
            encryptedAgain,
            '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
        );
        expect(againDecrypted).toEqual(originalJson);
    });

    it('encrypt and decrypt', async () => {
        const data = { foo: 'x', bar: 'y' };

        const encrypted = await encrypt(
            data,
            Buffer.from('9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480', 'hex'), // coverage
        );
        expect(data).not.toEqual(encrypted);

        const decrypted = await decrypt(
            encrypted,
            '9bc3736f0b45cd681854a724b5bba67b9da1e50bc9983fd2dd56e53e74b75480',
        );
        expect(data).toEqual(decrypted);
    });

    it('read file content (ArrayBuffer)', async () => {
        const file = fs.readFileSync(`./src/utils/suite/__fixtures__/${filename}.mtdt`);
        function toArrayBuffer(buf: Buffer) {
            const ab = new ArrayBuffer(buf.length);
            const view = new Uint8Array(ab);
            for (let i = 0; i < buf.length; ++i) {
                view[i] = buf[i];
            }
            return ab;
        }

        const content = arrayBufferToBuffer(toArrayBuffer(file));
        expect(content).toEqual(file);
    });

    it('urlSearchParams', () => {
        const input1 =
            '?code=mnau-haf&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.appdata';
        expect(urlSearchParams(input1)).toEqual({
            code: 'mnau-haf',
            scope: 'https://www.googleapis.com/auth/drive.appdata',
        });

        const input2 = '?code=mnau-ha?#f';
        expect(urlSearchParams(input2)).toEqual({
            code: 'mnau-ha?#f',
        });
    });
});
