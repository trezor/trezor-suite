export type MetadataAddPayload =
    | {
          type: 'outputLabel';
          accountKey: string;
          txid: string;
          outputIndex: number;
          defaultValue: string;
          value?: string;
      }
    | {
          type: 'addressLabel';
          accountKey: string;
          defaultValue: string;
          value?: string;
      }
    | {
          type: 'accountLabel';
          accountKey: string;
          defaultValue: string;
          value?: string;
      }
    | {
          type: 'walletLabel';
          deviceState: string;
          defaultValue: string;
          value?: string;
      };

// TODO version 2.0.0
// export interface MetadataItem {
//     ts: number;
//     value?: string;
// }
export type MetadataItem = string;

export type MetadataProviderType = 'dropbox' | 'google' | 'fileSystem' | 'sdCard';

export type Tokens = {
    accessToken?: string;
    refreshToken?: string;
};

export type MetadataEncryptionVersion = 1 | 2;

export type MetadataFileInfo = {
    fileName: string;
    content: Buffer;
};

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
    abstract getProviderDetails(): Result<MetadataProvider>;
    /**
     * For given filename download metadata file from provider
     */
    abstract getFileContent(fileName: string): Result<Buffer | undefined>;
    /**
     * Upload metadata content in a batch cloud provider for given filenames and content
     * (required by the providers)
     */
    abstract batchSetFileContent(files: Array<MetadataFileInfo>): Result<void>;
    /**
     * Upload metadata content in cloud provider for given filename and content
     */
    abstract setFileContent(file: string, content: any): Result<void>;

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
}

export interface AccountMetadata {
    key: string; // legacy xpub format (btc-like coins) or account descriptor (other coins)
    fileName: string; // file name in dropbox
    aesKey: string; // asymmetric key for file encryption
    accountLabel?: MetadataItem;
    outputLabels: { [txid: string]: { [index: string]: MetadataItem } };
    addressLabels: { [address: string]: MetadataItem };
}

export type DeviceMetadata =
    | {
          status: 'disabled' | 'cancelled'; // user rejects "Enable labeling" on device
      }
    | {
          status: 'enabled';
          key: string; // master key for all values (Device and Account)
          fileName: string; // file name in dropbox
          aesKey: string; // asymmetric key for file encryption
          walletLabel?: string;
      };

export interface MetadataState {
    enabled: boolean; // global for all devices
    provider?: MetadataProvider;
    // is there active inline input? only one may be active at time so we save this
    // information in reducer to make it easily accessible in UI.
    // field shall hold default value for which user may add metadata (address, txId, etc...);
    editing?: string;
    initiating?: boolean;
}

export type OAuthServerEnvironment = 'production' | 'staging' | 'localhost';
