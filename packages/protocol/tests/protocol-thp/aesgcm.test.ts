import { aesgcm } from '../../src/protocol-thp/crypto/aesgcm';

it('AESGCM encode/decode', () => {
    const key = Buffer.from(
        'ccbf529fc8dd4662d4d1d1fa66368b8758c0b6673a1bb9d532d95ca607cbf729',
        'hex',
    );
    const iv1 = Buffer.alloc(12).fill(0);
    const plaintext = Buffer.from(
        'd28c57e2c61ccddf449fc65a585cbe98f061e0fa99911763423440ee84710c2a',
        'hex',
    );
    const authData = Buffer.from(
        '152fd53e7dcee02d6f30b80371674b0a777441ca035919724c2f6bbfad6ed7eb',
        'hex',
    );

    const aesCtx = aesgcm(key, iv1);
    aesCtx.auth(authData);
    const staticPubKey = aesCtx.encrypt(plaintext);
    const tag = aesCtx.finish();

    const aesCtx2 = aesgcm(key, iv1);
    aesCtx2.auth(authData);
    const decryptedData = aesCtx2.decrypt(staticPubKey, tag);
    expect(decryptedData.toString('hex')).toEqual(plaintext.toString('hex'));
});
