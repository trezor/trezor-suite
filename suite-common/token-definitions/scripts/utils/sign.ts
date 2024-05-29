/* eslint-disable no-console */

// eslint-disable-next-line import/no-extraneous-dependencies
import * as jws from 'jws';

import { JWS_SIGN_ALGORITHM } from '../../src/tokenDefinitionsConstants';
import { TokenStructure } from '../../src/tokenDefinitionsTypes';

// There must be no extra spaces at the beginning of the line.
const devPrivateKey = `-----BEGIN EC PRIVATE KEY-----
MHQCAQEEINi7lfZE3Y5U9srS58A+AN7Ul7HeBXsHEfzVzijColOkoAcGBSuBBAAKoUQDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END EC PRIVATE KEY-----`;

const getPrivateKey = () => {
    // Only CI jobs flagged with "codesign", sign message system config by production private key. All other branches use development key.
    // The isCodesignBuild() util cannot be used here because the lib is not built at this point. Building libs would make the release script slower.
    if (process.env.IS_CODESIGN_BUILD !== 'true') {
        console.log('Signing config using develop private key!');

        return devPrivateKey;
    }

    console.log('Signing config using production private key!');

    const privateKey = process.env.JWS_PRIVATE_KEY_ENV; // available on GitHub

    if (!privateKey) {
        throw Error('Missing private key!');
    }

    return privateKey;
};

export const signData = (data: TokenStructure) => {
    const jwsFile = jws.sign({
        header: { alg: JWS_SIGN_ALGORITHM },
        payload: data,
        secret: getPrivateKey(),
    });

    console.log('Config signed, length:', jwsFile.length);

    return jwsFile;
};
