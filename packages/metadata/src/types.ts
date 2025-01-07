import { StaticSessionId } from '@trezor/connect';

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

export type MetadataAddPayload = { skipSave?: boolean } & (
    | {
          type: 'outputLabel';
          entityKey: string;
          txid: string;
          outputIndex: number;
          defaultValue?: string;
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
          networkType?: string;
          path?: string;
      }
    | {
          type: 'walletLabel';
          entityKey: string;
          defaultValue?: string;
          value?: string;
      }
);

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

export enum ProviderErrorReason {
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

export type Data = Record<
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
    providers: {
        [clientId: string]: MetadataProvider;
    };
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
    key_filename: Record<string, `${string}.mtdt`>;
    deviceSecrets: Record<StaticSessionId, string>;
}

export type OAuthServerEnvironment = 'production' | 'staging' | 'localhost';
export type MetadataEncryptionVersion = 1 | 2;

type Password = Buffer;

export type PasswordEntry = {
    nonce: string;
    note?: string;
    password: Password;
    safe_note?: Password;
    title: string;
    username: string;
    tags: number[];
    // legacy (old TPM) value, not used
    export?: boolean;
    // legacy (old TPM) value, not used
    key_value?: string;
    // legacy (old TPM) value, not used
    success?: boolean;
};

export type PasswordEntryDecoded = {
    title: string;
    username: string;
    password: string;
    note: string;
    safe_note: string;
    tags: number[];
};

export type PasswordTag = { title: string; icon: string };

export type PasswordManagerState = {
    config: {
        orderType: string;
    };
    entries: Record<number, PasswordEntry>;
    version: string;
    // legacy value, not used
    extVersion?: string;
    tags: Record<number, PasswordTag>;
};

export type Credentials =
    | { access_token?: undefined; code: string }
    | { access_token: string; code?: undefined };
