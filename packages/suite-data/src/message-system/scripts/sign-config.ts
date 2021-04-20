import * as fs from 'fs-extra';
import * as jws from 'jws';
import { join } from 'path';

import {
    CONFIG_PATH,
    JWS_PRIVATE_KEY,
    PACKAGE_ROOT,
    PROJECT_ROOT,
    JWS_CONFIG_FILENAME,
} from '../constants';

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
    fs.outputFileSync(
        join(PACKAGE_ROOT, 'files', 'message-system', JWS_CONFIG_FILENAME),
        jwsConfig,
    );
    console.log(`JWS signature saved to ${join(PROJECT_ROOT, 'config', JWS_CONFIG_FILENAME)}!`);
};

const jwsConfig = getConfigJwsSignature();
saveConfigJwsSignature(jwsConfig);
