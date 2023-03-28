const publicKey = {
    dev: '-----BEGIN PUBLIC KEY-----MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==-----END PUBLIC KEY-----',
    codesign:
        '-----BEGIN PUBLIC KEY-----MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAES7MbBzU/v5BsljkTM8Mz0Jsk+Nn5n2wH\no2/+MUI3TgCVdTbEHhn3HXaY7GJ6TLyWqxn+pIDY9wUUAyUqOStTUQ==-----END PUBLIC KEY-----',
};

export const getJWSPublicKey = () => {
    const isCodesignBuild = process.env.IS_CODESIGN_BUILD === 'true';
    console.log(`Bundling ${isCodesignBuild ? 'production' : 'develop'} public key.`);

    return isCodesignBuild ? publicKey.codesign : publicKey.dev;
};
