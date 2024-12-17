import { TypedEmitter } from '@trezor/utils';

import {
    MetadataProvider,
    MetadataProviderType,
    Result,
    Success,
    ProviderErrorReason,
    Credentials,
} from '../types';

type Events = {
    'request-receiver-url': (callback: (url: string) => void) => void;
    'request-code': (url: string, callback: (credentials: Credentials) => void) => void;
};

export abstract class AbstractMetadataProvider extends TypedEmitter<Events> {
    /* isCloud means that this provider is not local and allows multi client sync. These providers are suitable for backing up data. */
    abstract isCloud: boolean;

    constructor(public type: MetadataProviderType) {
        super();
    }

    abstract connect(): Result<void>;
    abstract disconnect(): Result<void>;
    /**
     * Try to get valid access token from refresh token. If operation is successful, provider
     * is connected.
     */
    abstract isConnected(): Promise<boolean> | boolean;
    /**
     * Get details if provider that are supposed to be saved in reducer
     */
    abstract getProviderDetails(): Result<Omit<MetadataProvider, 'data'>>;
    /**
     * For given filename download metadata file from provider
     */
    abstract getFileContent(file: string): Result<Buffer | undefined>;
    /**
     * Upload metadata content in cloud provider for given filename and content
     */
    abstract setFileContent(file: string, content: any): Result<void>;
    /**
     * Get a list of metadata file names if any
     */
    abstract getFilesList(): Result<string[] | undefined>;

    abstract renameFile(from: string, to: string): Result<void>;

    ok(): Success<void>;
    ok<T>(payload: T): Success<T>;
    ok(payload?: any) {
        const success = true as const;
        if (payload) {
            return {
                success,
                payload,
            };
        }

        return { success } as const;
    }

    error(code: keyof typeof ProviderErrorReason, reason: string) {
        const success = false as const;

        return {
            success,
            code,
            error: reason,
        } as const;
    }

    scheduleApiRequest<T extends () => ReturnType<R>, R extends (...args: any) => Result<any>>(
        fn: T,
        options: { retries: number; delay: number } = { retries: 3, delay: 1000 },
    ) {
        let retried = 0;

        return new Promise<Awaited<ReturnType<R>>>(resolve => {
            const { retries, delay } = options;
            const run = async () => {
                const res = await fn();

                if (res.success) {
                    return resolve(res);
                }

                if (retries > 0 && retried < retries) {
                    retried++;
                    setTimeout(run, delay);
                } else {
                    // reached retries limit, return error
                    resolve(res);
                }
            };
            run();
        });
    }
}
