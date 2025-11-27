import { initIDB } from 'idb-stores';
import { z } from 'zod';

const credentialId = z.base64url();
const salt = z.base64url();

const webAuthnCredential = z.object({
    credentialId,
    transports: z.array(z.string()),
    userId: z.base64url(),
    publicKey: z.base64url(),
});

export type WebAuthnCredential = z.infer<typeof webAuthnCredential>;

export const getStore = initIDB({
    database: {
        name: 'trezor-suite-webauthn',
        version: 1,
    },
    storeSchemas: {
        webauthn: z.object({
            enabled: z.boolean().default(false),

            credentials: z.array(webAuthnCredential).optional().default([]),
        }),

        encryptedStorage: z.object({
            enabled: z.boolean().default(false),
            salt: salt.nullish().default(null),
            // sessions: z.record(credentialId, z.object({ salt })).nullish().default(null),
        }),
    },
});
