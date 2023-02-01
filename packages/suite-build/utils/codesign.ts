import fs from 'fs';

// There must be no extra spaces at the beginning of the line.
const devPublicKey = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END PUBLIC KEY-----`;

export const getPublicKey = () => {
    const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';
    console.log(`Bundling ${isCodesignBuild ? 'production' : 'develop'} public key.`);

    if (!isCodesignBuild) {
        return devPublicKey;
    }

    const keyEnv = process.env.JWS_PUBLIC_KEY_ENV; // available on GitHub
    const keyFile = process.env.JWS_PUBLIC_KEY_FILE; // available on GitLab

    const publicKey = keyEnv || (keyFile && fs.readFileSync(keyFile, 'utf-8'));

    if (!publicKey) {
        throw new Error('Missing public key!');
    }

    return publicKey;
};
