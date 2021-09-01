import fs from 'fs';
import path from 'path';
import openpgp from 'openpgp';

import { getReleaseNotes } from '@suite/services/github';

const signingKey = process.env.APP_PUBKEY;

// This will prevent the auto-updater from loading if the pubkey is not defined
if (signingKey === undefined) {
    throw new Error('APP_PUBKEY is undefined.');
}

export const verifySignature = async (version: string, downloadedFile: string) => {
    // Get release info from Github
    const info = await getReleaseNotes(version);

    if (!info) {
        throw new Error('Version does not exist.');
    }

    // Find the right signature for the downloaded file
    const filename = path.basename(downloadedFile);
    const releaseSignature = info.assets.find(a => a.name === `${filename}.asc`);

    if (!releaseSignature) {
        throw new Error('Signature not found.');
    }

    // Fetch signature
    const signatureFile = await (await fetch(releaseSignature.browser_download_url)).text();

    // Read downloaded file and create message to verify
    const file = await fs.promises.readFile(downloadedFile);
    const message = await openpgp.createMessage({ binary: file });

    // Load pubkey and signature
    const pubkey = await openpgp.readKey({ armoredKey: signingKey });
    const signature = await openpgp.readSignature({
        armoredSignature: signatureFile,
    });

    // Check file against signature
    const verified = await openpgp.verify({
        message,
        signature,
        verificationKeys: pubkey,
        format: 'binary',
    });

    // Get result (validity of the signature)
    const valid = await verified.signatures[0].verified;
    if (!valid) {
        throw new Error('Invalid signature.');
    }
};
