import * as jose from 'jose';

import * as pubkeysSPKI from '../pubkeys';
import * as pubkeysJWK from '../pubkeys-jwk';

describe('pubkeys', () => {
    it('SPKI import', async () => {
        //await jose.importSPKI(pubkeysSPKI.mainPublicKey.dev.trim(), 'ES256');
        //await jose.importSPKI(pubkeysSPKI.mainPublicKey.codesign.trim(), 'ES256');
        await jose.importSPKI(pubkeysSPKI.firmwareConfigPublicKey.dev.trim(), 'ES256');
        await jose.importSPKI(pubkeysSPKI.firmwareConfigPublicKey.codesign.trim(), 'ES256');
    });

    it('JWK import', async () => {
        //await jose.importJWK(pubkeysJWK.mainPublicKey.dev, 'ES256');
        //await jose.importJWK(pubkeysJWK.mainPublicKey.codesign, 'ES256');
        await jose.importJWK(pubkeysJWK.firmwareConfigPublicKey.dev, 'ES256');
        await jose.importJWK(pubkeysJWK.firmwareConfigPublicKey.codesign, 'ES256');
    });
});
