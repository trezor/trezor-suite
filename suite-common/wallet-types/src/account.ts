import { Network } from '@suite-common/wallet-networks-config';
import { AccountInfo } from '@trezor/connect';

export type MetadataItem = string;

export interface AccountMetadata {
    key: string; // legacy xpub format (btc-like coins) or account descriptor (other coins)
    fileName: string; // file name in dropbox
    aesKey: string; // asymmetric key for file encryption
    accountLabel?: MetadataItem;
    outputLabels: { [txid: string]: { [index: string]: MetadataItem } };
    addressLabels: { [address: string]: MetadataItem };
}

type AccountNetworkSpecific =
    | {
          networkType: 'bitcoin';
          misc: undefined;
          marker: undefined;
          page: AccountInfo['page'];
      }
    | {
          networkType: 'ripple';
          misc: { sequence: number; reserve: string };
          marker: AccountInfo['marker'];
          page: undefined;
      }
    | {
          networkType: 'cardano';
          marker: undefined;
          misc: {
              staking: {
                  address: string;
                  isActive: boolean;
                  rewards: string;
                  poolId: string | null;
              };
          };
          page: AccountInfo['page'];
      }
    | {
          networkType: 'ethereum';
          misc: { nonce: string };
          marker: undefined;
          page: AccountInfo['page'];
      };

export type Account = {
    deviceState: string;
    key: string;
    index: number;
    path: string;
    descriptor: string;
    accountType: NonNullable<Network['accountType']>;
    symbol: Network['symbol'];
    empty: boolean;
    visible: boolean;
    imported?: boolean;
    failed?: boolean;
    balance: string;
    availableBalance: string;
    formattedBalance: string;
    tokens: AccountInfo['tokens'];
    addresses: AccountInfo['addresses'];
    utxo: AccountInfo['utxo'];
    history: AccountInfo['history'];
    metadata: AccountMetadata;
} & AccountNetworkSpecific;
