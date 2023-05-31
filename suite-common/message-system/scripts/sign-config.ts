/* eslint-disable no-console */

import * as fs from 'fs-extra';
import * as jws from 'jws';
import { join } from 'path';

import { CONFIG_PATH, PACKAGE_ROOT } from './constants';
import { JWS_CONFIG_FILENAME, JWS_SIGN_ALGORITHM } from '../src/messageSystemConstants';

// There must be no extra spaces at the beginning of the line.
const devPrivateKey = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEINi7lfZE3Y5U9srS58A+AN7Ul7HeBXsHEfzVzijColOkoAcGBSuBBAAKoUQDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END EC PRIVATE KEY-----`;

const getPrivateKey = () => {
    /* Only CI jobs flagged with "codesign", sign message system config by production private key.
     * All other branches use development key. */
    const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';

    if (!isCodesignBuild) {
        console.log('Signing config using develop private key!');

        return devPrivateKey;
    }

    console.log('Signing config using production private key!');

    const keyEnv = process.env.JWS_PRIVATE_KEY_ENV; // available on GitHub
    const keyFile = process.env.JWS_PRIVATE_KEY_FILE; // available on GitLab

    const privateKey = keyEnv || (keyFile && fs.readFileSync(keyFile, 'utf-8'));

    if (!privateKey) {
        throw Error('Missing private key!');
    }

    return privateKey;
};

const getConfigJwsSignature = () => {
    console.log('Creating a JWS signature from the config...');

    const config = fs.readFileSync(CONFIG_PATH, 'utf-8');

    const jwsConfig = jws.sign({
        header: { alg: JWS_SIGN_ALGORITHM },
        payload: config,
        secret: getPrivateKey(),
    });

    console.log('JWS signature created!');

    return jwsConfig;
};

const saveConfigJwsSignature = (jwsConfig: string) => {
    const destination = join(PACKAGE_ROOT, 'files', JWS_CONFIG_FILENAME);
    fs.outputFileSync(destination, jwsConfig);
    console.log(`JWS signature saved to ${destination}!`);
};

const jwsConfig = getConfigJwsSignature();
saveConfigJwsSignature(jwsConfig);
