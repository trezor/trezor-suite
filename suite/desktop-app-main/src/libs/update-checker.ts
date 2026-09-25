import type { VerifyUpdateFile } from 'electron-updater';
import fs from 'fs';
import { createMessage, readKey, readSignature, verify } from 'openpgp';

import { removeTrailingSlashes, serializeError } from '@trezor/utils';

const signingKey = process.env.APP_PUBKEY;

// This will prevent the auto-updater from loading if the pubkey is not defined
if (signingKey === undefined) {
    throw new Error('APP_PUBKEY is undefined.');
}

type GetSignatureFileProps = { feedURL: string; originalUpdateFileName: string };

const GET_SIGNATURE_TIMEOUT = 10_000; // [ms]
/**
 * Get signature files, which are available next to installation files.
 */
export const getSignatureFile = async ({
    originalUpdateFileName,
    feedURL,
}: GetSignatureFileProps) => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), GET_SIGNATURE_TIMEOUT);

    try {
        const signatureFileURL = `${removeTrailingSlashes(feedURL)}/${originalUpdateFileName}.asc`;
        const signatureFile = await fetch(signatureFileURL, { signal: abortController.signal });

        if (!signatureFile.ok) {
            throw new Error(
                `Failed to fetch signature file from ${signatureFileURL}: ${signatureFile.status} ${signatureFile.statusText}.`,
            );
        }

        return await signatureFile.text();
    } finally {
        clearTimeout(timeoutId);
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

type CreateVerifyUpdateFileParams = {
    feedURL: string;
    onVerifyStart?: () => void;
};

export const createVerifyUpdateFile =
    ({ feedURL, onVerifyStart }: CreateVerifyUpdateFileParams): VerifyUpdateFile =>
    async ({ temporaryUpdateFilePath, originalUpdateFileName }) => {
        onVerifyStart?.();

        try {
            const signatureFile = await getSignatureFile({ originalUpdateFileName, feedURL });
            await verifySignature({ downloadedFile: temporaryUpdateFilePath, signatureFile });

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: serializeError(error),
            };
        }
    };
