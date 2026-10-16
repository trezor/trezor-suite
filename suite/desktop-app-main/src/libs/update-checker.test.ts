import { createMessage, generateKey, readPrivateKey, sign } from 'openpgp';

import { verifySignature } from './update-checker';

const downloadedFile = '/path/to/Trezor-Suite.AppImage';
const fileContent = new TextEncoder().encode('mock update file content');

const generateArmoredKeys = () =>
    generateKey({
        type: 'ecc',
        curve: 'curve25519Legacy',
        userIDs: [{ name: 'Test Signer', email: 'test@example.com' }],
        format: 'armored',
    });

const signContent = async (content: Uint8Array, armoredPrivateKey: string) =>
    sign({
        message: await createMessage({ binary: content }),
        signingKeys: await readPrivateKey({ armoredKey: armoredPrivateKey }),
        detached: true,
        format: 'armored',
    });

const mockReadFile = (content: Uint8Array) => jest.fn((_path: string) => Promise.resolve(content));

describe(verifySignature.name, () => {
    let signingKeys: Awaited<ReturnType<typeof generateArmoredKeys>>;
    let otherKeys: Awaited<ReturnType<typeof generateArmoredKeys>>;

    beforeAll(async () => {
        [signingKeys, otherKeys] = await Promise.all([
            generateArmoredKeys(),
            generateArmoredKeys(),
        ]);
    });

    it('resolves when the file is signed by the signing key', async () => {
        const readFile = mockReadFile(fileContent);
        const signatureFile = await signContent(fileContent, signingKeys.privateKey);

        await expect(
            verifySignature({
                downloadedFile,
                signatureFile,
                signingKey: signingKeys.publicKey,
                readFile,
            }),
        ).resolves.toBeUndefined();
        expect(readFile).toHaveBeenCalledWith(downloadedFile);
    });

    it('rejects when the file content does not match the signature', async () => {
        const signatureFile = await signContent(fileContent, signingKeys.privateKey);

        await expect(
            verifySignature({
                downloadedFile,
                signatureFile,
                signingKey: signingKeys.publicKey,
                readFile: mockReadFile(new TextEncoder().encode('tampered update file content')),
            }),
        ).rejects.toThrow('Signed digest did not match');
    });

    it('rejects when the file is signed by a different key', async () => {
        const signatureFile = await signContent(fileContent, otherKeys.privateKey);

        await expect(
            verifySignature({
                downloadedFile,
                signatureFile,
                signingKey: signingKeys.publicKey,
                readFile: mockReadFile(fileContent),
            }),
        ).rejects.toThrow('Could not find signing key with key ID');
    });

    it('rejects when the signature file is not a valid armored signature', async () => {
        await expect(
            verifySignature({
                downloadedFile,
                signatureFile: 'not a signature',
                signingKey: signingKeys.publicKey,
                readFile: mockReadFile(fileContent),
            }),
        ).rejects.toThrow('Misformed armored text');
    });

    it('rejects when the signing key is not a valid armored key', async () => {
        const signatureFile = await signContent(fileContent, signingKeys.privateKey);

        await expect(
            verifySignature({
                downloadedFile,
                signatureFile,
                signingKey: 'not a key',
                readFile: mockReadFile(fileContent),
            }),
        ).rejects.toThrow('Misformed armored text');
    });

    it('rejects when the file cannot be read', async () => {
        const signatureFile = await signContent(fileContent, signingKeys.privateKey);

        await expect(
            verifySignature({
                downloadedFile,
                signatureFile,
                signingKey: signingKeys.publicKey,
                readFile: () => Promise.reject(new Error('ENOENT')),
            }),
        ).rejects.toThrow('ENOENT');
    });
});
