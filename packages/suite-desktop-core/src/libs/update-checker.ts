import fs from 'fs';
import { createMessage, readKey, readSignature, verify } from 'openpgp';
import path from 'path';

import { removeTrailingSlashes } from '@trezor/utils';

const signingKey = process.env.APP_PUBKEY;

// This will prevent the auto-updater from loading if the pubkey is not defined
if (signingKey === undefined) {
    throw new Error('APP_PUBKEY is undefined.');
}

type GetSignatureFileProps = { feedURL: string; downloadedFile: string };

/**
 * Get signature files, which are available next to installation files.
 */
export const getSignatureFile = async ({ downloadedFile, feedURL }: GetSignatureFileProps) => {
    try {
        const filename = path.basename(downloadedFile);
        const signatureFileURL = `${removeTrailingSlashes(feedURL)}/${filename}.asc`;
        const signatureFile = await fetch(signatureFileURL);

        return signatureFile.text();
    } catch {
        return null;
    }
};

type VerifySignatureProps = { downloadedFile: string; signatureFile: string };

export const verifySignature = async ({ downloadedFile, signatureFile }: VerifySignatureProps) => {
    // Read downloaded file and create message to verify
    const file = await fs.promises.readFile(downloadedFile);
    const message = await createMessage({ binary: file });

    // Load pubkey and signature
    const pubkey = await readKey({ armoredKey: signingKey });
    const signature = await readSignature({
        armoredSignature: signatureFile,
    });

    // Check file against signature
    const verified = await verify({
        message,
        signature,
        verificationKeys: pubkey,
        format: 'binary',
    });

    // Get result (validity of the signature)
    const firstSignature = verified.signatures[0];
    if (!firstSignature) {
        throw new Error('No signatures found.');
    }
    const valid = await firstSignature.verified;
    if (!valid) {
        throw new Error('Invalid signature.');
    }
};
