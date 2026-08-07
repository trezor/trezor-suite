/* eslint-disable no-console */

import { readFileSync, writeFileSync } from 'fs';
import * as jws from 'jws';
import { join } from 'path';

import { OUTPUT_DIR } from './constants';
import {
    JWS_MANIFEST_FILENAME,
    JWS_SIGN_ALGORITHM,
    MANIFEST_FILENAME,
} from '../src/releaseNotesConstants';
import { ReleaseNotesPlatform } from '../src/releaseNotesTypes';

// Unlike the message system, release notes have a single publishing location and therefore a single
// signer. There is no development key fallback - a missing key must fail the release loudly.
const getPrivateKey = () => {
    const privateKey = process.env.JWS_PRIVATE_KEY_ENV; // available on GitHub

    if (!privateKey) {
        throw Error('Missing private key!');
    }

    return privateKey;
};

const signManifest = (platform: ReleaseNotesPlatform, privateKey: string) => {
    const manifest = readFileSync(join(OUTPUT_DIR, platform, MANIFEST_FILENAME), 'utf-8');

    const jwsManifest = jws.sign({
        header: { alg: JWS_SIGN_ALGORITHM },
        payload: manifest,
        secret: privateKey,
    });

    const destination = join(OUTPUT_DIR, platform, JWS_MANIFEST_FILENAME);

    writeFileSync(destination, jwsManifest);
    console.log(`Signed ${platform} manifest saved to ${destination}`);
};

const signManifests = () => {
    const privateKey = getPrivateKey();

    Object.values(ReleaseNotesPlatform).forEach(platform => signManifest(platform, privateKey));
};

signManifests();
