import { Network, BackendType, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountInfo, PROTO, TokenInfo } from '@trezor/connect';

export type MetadataItem = string;
export type XpubAddress = string;

export type TokenSymbol = string & { __type: 'TokenSymbol' };
export type TokenAddress = string & { __type: 'TokenAddress' };

export type TokenInfoBranded = TokenInfo & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

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

// decides if account is using TrezorConnect/blockchain-link or other non-standard api
export type AccountBackendSpecific =
    | {
          backendType?: Exclude<BackendType, 'coinjoin'>;
      }
    | {
          backendType: Extract<BackendType, 'coinjoin'>;
          status: 'initial' | 'ready' | 'error' | 'out-of-sync';
          syncing?: boolean;
      };

export type AccountKey = string;

export type Account = {
    deviceState: string;
    key: AccountKey;
    index: number;
    path: string;
    unlockPath?: PROTO.UnlockPath; // parameter used to unlock SLIP-25/coinjoin keychain
    descriptor: string;
    accountType: NonNullable<Network['accountType']>;
    symbol: NetworkSymbol;
    empty: boolean;
    visible: boolean;
    imported?: boolean;
    failed?: boolean;
    balance: string;
    availableBalance: string;
    formattedBalance: string;
    tokens: AccountInfo['tokens'];
    addresses?: AccountInfo['addresses'];
    utxo: AccountInfo['utxo'];
    history: AccountInfo['history'];
    metadata: AccountMetadata;
} & AccountBackendSpecific &
    AccountNetworkSpecific;

export type AccountType = Account['accountType'];

export type WalletParams =
    | NonNullable<{
          symbol: NetworkSymbol;
          accountIndex: number;
          accountType: AccountType | 'normal';
      }>
    | undefined;

export interface ReceiveInfo {
    path: string;
    address: string;
    isVerified: boolean;
}
