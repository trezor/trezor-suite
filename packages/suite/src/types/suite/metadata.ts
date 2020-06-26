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

export type MetadataProviderType = 'dropbox' | 'google' | 'userData' | 'sdCard';

export type MetadataProviderCredentials = {
    type: MetadataProviderType;
    user: string;
    token: string;
};

export interface AbstractMetadataProvider {
    connect: () => Promise<boolean>;
    disconnect: () => Promise<boolean>;
    getFileContent: (file: string) => Promise<ArrayBuffer | Buffer | void>;
    setFileContent: (file: string, content: any) => Promise<any>;
    isConnected: () => boolean;
    isLoading: () => boolean;
    getCredentials: () => Promise<MetadataProviderCredentials | void>;
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
    provider?: MetadataProviderCredentials;
}
