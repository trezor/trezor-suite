import {
    type RelayDevice,
    type RelayErrorCode,
    RelayFailure,
    type RelayMessage,
    type WardRelay,
    type WardRelayEndpoint,
} from '@trezor/ward';

/** Structural contract implemented by the Rust adapter's Node.js binding. */
export type RustWardAdapter = {
    call(
        method: string,
        params?: Record<string, unknown>,
        device?: RelayDevice,
    ): Promise<Record<string, unknown>>;
    answerWardRequest(name: string, message: Record<string, unknown>): Promise<RelayMessage>;
    close(): Promise<void>;
};

export type RustWardRelayOptions = {
    connect: () => Promise<RustWardAdapter>;
};

const errorCodes: readonly string[] = [
    'bad_request',
    'unauthorised',
    'version_mismatch',
    'no_store',
    'device_failure',
    'ward_id_mismatch',
    'internal',
];

/** The device's mid-call pulls: the wardd method that answers each, by its request message. */
const PULLS: Partial<Record<string, string>> = {
    answerProofRequest: 'WARDProofRequest',
    answerNodeRequest: 'WARDNodeRequest',
};

/** Inject through `init({ wardd })`; the application loads the platform's native addon. */
export class RustWardRelay implements WardRelay {
    constructor(private readonly options: RustWardRelayOptions) {}

    async connect(): Promise<WardRelayEndpoint> {
        const adapter = await this.options.connect();

        return {
            call: async (method, params = {}, device) => {
                const pull = PULLS[method];
                if (pull) {
                    const { request } = params;
                    if (!request || typeof request !== 'object' || Array.isArray(request)) {
                        throw new RelayFailure('bad_request', 'a WARD pull request is required');
                    }
                    const reply = await adapter.answerWardRequest(
                        pull,
                        request as Record<string, unknown>,
                    );

                    return reply.message;
                }
                if (method === 'hello') {
                    throw new RelayFailure(
                        'bad_request',
                        'the native adapter performs its handshake',
                    );
                }

                try {
                    return await adapter.call(method, params, device);
                } catch (error) {
                    // Native errors cannot share the JavaScript RelayFailure prototype.
                    if (
                        error instanceof Error &&
                        'code' in error &&
                        typeof error.code === 'string'
                    ) {
                        const code = errorCodes.includes(error.code)
                            ? (error.code as RelayErrorCode)
                            : 'internal';
                        throw new RelayFailure(code, error.message);
                    }
                    throw error;
                }
            },
            close: () => adapter.close(),
        };
    }
}
