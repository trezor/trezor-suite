// Public keys for message-system JWS verification
//
// Warning: Keys are secp256k1 instead of P-256, which is a deviation from the ES256 specification (RFC 7518). This issue is known and it has been accepted,
// as it has no security implications.
// Impact: It is not possible to easily replace `jws` library, as most alternatives verify that the used keys are P-256.

export const publicKey = {
    dev: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END PUBLIC KEY-----`,
    codesign: `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAES7MbBzU/v5BsljkTM8Mz0Jsk+Nn5n2wH\no2/+MUI3TgCVdTbEHhn3HXaY7GJ6TLyWqxn+pIDY9wUUAyUqOStTUQ==
-----END PUBLIC KEY-----`,
};
