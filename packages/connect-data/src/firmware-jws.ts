export const firmwareConfigPublicKey = {
    dev: `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEEKjWdvv8SJm/UN2lXoEXl3ID35b/
hsz3etxANvUgLQ4r0eEhqVUEL5l+dRMgEv4Ycvr3UEcMkSFRPoA8ktxX1A==
-----END PUBLIC KEY-----
`,
    codesign: `
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfEsFXNi5sdMxwiOYh4oRGorCM2RO
IEsfw3m+vWBrLb/r/GYWUVkVXWsZukLwPRZ8asP+7Ifd2ap7GZ2iQzWKCA==
-----END PUBLIC KEY-----
`,
};

export const getFirmwareReleaseJwsPublicKey = (useCodeSignKey = false) =>
    useCodeSignKey ? firmwareConfigPublicKey.codesign : firmwareConfigPublicKey.dev;
