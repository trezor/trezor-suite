import * as fs from 'fs-extra';
import * as jws from 'jws';
import { join } from 'path';

import { CONFIG_PATH, PACKAGE_ROOT, JWS_CONFIG_FILENAME } from '../constants';

/* Only CI jobs flagged with "codesign", sign message system config by production private key.
 * All other branches use development key. */
const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';
let JWS_PRIVATE_KEY;

if (isCodesignBuild) {
    console.log('Signing config using production private key!');

    JWS_PRIVATE_KEY = fs.readFileSync(process.env.JWS_PRIVATE_KEY_FILE!, 'utf-8');
} else {
    console.log('Signing config using develop private key!');

    JWS_PRIVATE_KEY = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEINi7lfZE3Y5U9srS58A+AN7Ul7HeBXsHEfzVzijColOkoAcGBSuBBAAKoUQDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END EC PRIVATE KEY-----`;
}

const getConfigJwsSignature = () => {
    console.log('Creating a JWS signature from the config...');

    const config = fs.readFileSync(CONFIG_PATH, 'utf-8');

    const jwsConfig = jws.sign({
        header: { alg: 'ES256' },
        payload: config,
        secret: JWS_PRIVATE_KEY,
    });

    console.log('JWS signature created!');

    return jwsConfig;
};

const saveConfigJwsSignature = jwsConfig => {
    const destination = join(PACKAGE_ROOT, 'files', 'message-system', JWS_CONFIG_FILENAME);
    fs.outputFileSync(destination, jwsConfig);
    console.log(`JWS signature saved to ${destination}!`);
};

const jwsConfig = getConfigJwsSignature();
saveConfigJwsSignature(jwsConfig);
