import { z } from 'zod';

export const envSchema = z.object({
    EXPO_PUBLIC_ENVIRONMENT: z.string(),
    EXPO_PUBLIC_CODESIGN_BUILD: z.string(),
    EXPO_PUBLIC_JWS_PUBLIC_KEY: z.string(),
});

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> {}
    }
}
