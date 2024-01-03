export interface LabelableEntityKeys {
    fileName: string; // file name in data provider
    aesKey: string; // symmetric key for file encryption
}

export type DeviceEntityKeys = {
    [Version in MetadataEncryptionVersion]?: LabelableEntityKeys & { key: string };
};

export type AccountEntityKeys = {
    [Version in MetadataEncryptionVersion]?: LabelableEntityKeys;
} & {
    key: string; // legacy xpub format (btc-like coins) or account descriptor (other coins)
};

export type LabelableEntityKeysByVersion = DeviceEntityKeys | AccountEntityKeys;

export type MetadataAddPayload =
    | {
          type: 'outputLabel';
          entityKey: string;
          txid: string;
          outputIndex: number;
          defaultValue: string;
          value?: string;
      }
    | {
          type: 'addressLabel';
          entityKey: string;
          defaultValue: string;
          value?: string;
      }
    | {
          type: 'accountLabel';
          entityKey: string;
          defaultValue: string;
          value?: string;
      }
    | {
          type: 'walletLabel';
          entityKey: string;
          defaultValue: string;
          value?: string;
      };

// TODO version 2.0.0
// export interface MetadataItem {
//     ts: number;
//     value?: string;
// }
export type MetadataItem = string;

export type MetadataProviderType = 'dropbox' | 'google' | 'fileSystem' | 'inMemoryTest'; // Todo: | 'sdCard'

export type Tokens = {
    accessToken?: string;
    refreshToken?: string;
};

/**
 * What caused the error. Use this to handle error in metadataActions
 */
enum ProviderErrorReason {
    NOT_FOUND_ERROR,
    // authentication, typically expired token
    AUTH_ERROR,
    // possibly programmer errors, should not happen
    BAD_INPUT_ERROR, // some wrong parameter sent to API
    RATE_LIMIT_ERROR, // self-explanatory
    ACCESS_ERROR, // trying to access resource without permission
    // provider is dead, 5xx errors
    PROVIDER_ERROR,
    // common error if none of the above
    OTHER_ERROR,
    CONNECTIVITY_ERROR,
}

/**
 * When then error occurred.
 */
export enum ProviderErrorAction {
    SAVE = 'Failed to save labeling data',
    LOAD = 'Failed to load labeling data',
    CONNECT = 'Failed to connect to labeling provider',
    DECRYPT = 'Failed to decrypt files',
    ENCRYPT = 'Failed to encrypt files',
}

export type Success<Payload> = { success: true; payload: Payload };
export type Error = {
    success: false;
    code: keyof typeof ProviderErrorReason;
    error: string;
};
export type Result<T> = Promise<Success<T> | Error>;

export abstract class AbstractMetadataProvider {
    /* isCloud means that this provider is not local and allows multi client sync. These providers are suitable for backing up data. */
    abstract isCloud: boolean;

    // eslint-disable-next-line no-empty-function
    constructor(public type: MetadataProviderType) {}

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

export type AccountOutputLabels = { [index: string]: MetadataItem };

export interface AccountLabels {
    accountLabel?: MetadataItem;
    outputLabels: { [txid: string]: AccountOutputLabels };
    addressLabels: { [address: string]: MetadataItem };
}

export interface WalletLabels {
    walletLabel?: string;
}

export type Labels = AccountLabels | WalletLabels;

export type DeviceMetadata = DeviceEntityKeys;

type Data = Record<
    LabelableEntityKeys['fileName'], // unique "id" for mapping with labelable entitties
    Labels | PasswordManagerState
>;

/**
 * DataType dictates shape of data.
 * in the future, it could be
 * 'labels' | 'passwords' | 'contacts'...
 */
export type DataType = 'labels' | 'passwords';

/**
 * Representation of provider data stored in reducer
 * properties 'tokens' and 'type' are needed to recreate corresponding provider instance
 * others may be used in UI
 */
export type MetadataProvider = {
    type: MetadataProviderType;
    user: string;
    tokens: Tokens;
    isCloud: boolean;
    // decrypted content of data per provider
    data: Data;
    clientId: string;
};

export interface MetadataState {
    enabled: boolean; // global for all devices
    providers: MetadataProvider[];
    // being selected means:
    // - see data from this provider
    // - save data to this provider when making changes
    selectedProvider: { [key in DataType]: MetadataProvider['clientId'] };
    // is there active inline input? only one may be active at time so we save this
    // information in reducer to make it easily accessible in UI.
    // field shall hold default value for which user may add metadata (address, txId, etc...);
    editing?: string;
    initiating?: boolean;
    /**
     * error, typical reasons:
     * - user clicked cancel button on device when "Enable labeling" was shown.
     * - device disconnected
     */
    error?: { [deviceState: string]: boolean };
}

export type OAuthServerEnvironment = 'production' | 'staging' | 'localhost';
export type MetadataEncryptionVersion = 1 | 2;

type Password = {
    type: 'Buffer';
    data: Buffer;
};

export type PasswordEntry = {
    export: boolean;
    key_value: string;
    nonce: string;
    note?: string;
    password: Password;
    safe_note?: Password;
    success: boolean;
    title: string;
    username: string;
    tags: number[];
};

export type PasswordTag = { title: string; icon: string };

export type PasswordManagerState = {
    config: {
        orderType: string;
    };
    entries: Record<number, PasswordEntry>;
    extVersion: string;
    tags: Record<number, PasswordTag>;
};
