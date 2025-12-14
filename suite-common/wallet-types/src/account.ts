import { AccountEntityKeys } from '@suite-common/metadata-types';
import { AccountType, BackendType, Bip43Path, NetworkSymbol } from '@suite-common/wallet-config';
import {
    AddressAlias,
    ContractInfo,
    StakingPool,
} from '@trezor/blockchain-link-types/src/blockbook-api';
import { SolanaStakingAccount } from '@trezor/blockchain-link-types/src/solana';
import { AccountInfo, PROTO, StaticSessionId, TokenInfo } from '@trezor/connect';
import { Branded } from '@trezor/type-utils';

export type MetadataItem = string;
export type XpubAddress = string;

export type TokenSymbol = string & Branded<'TokenSymbol'>;
export type TokenAddress = string & Branded<'TokenAddress'>;
export const toTokenAddress = (value: string) => value as TokenAddress;

export type AddressType = 'contract' | 'fingerprint' | 'policyId';

export type TokenInfoBranded = TokenInfo & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

type AccountNetworkSpecific =
    | {
          networkType: 'bitcoin';
          misc: undefined;
          marker: undefined;
          stellarCursor: undefined;
          page: AccountInfo['page'];
      }
    | {
          networkType: 'ripple';
          misc: { sequence: number; reserve: string };
          marker: AccountInfo['marker'];
          stellarCursor: undefined;
          page: undefined;
      }
    | {
          networkType: 'cardano';
          marker: undefined;
          stellarCursor: undefined;
          misc: {
              staking: {
                  address: string;
                  isActive: boolean;
                  rewards: string;
                  poolId: string | null;
                  drep: {
                      drep_id: string;
                      hex: string;
                      amount: string;
                      active: boolean;
                      active_epoch: number | null;
                      has_script: boolean;
                  } | null;
              };
          };
          page: AccountInfo['page'];
      }
    | {
          networkType: 'ethereum';
          misc: {
              nonce: string;
              contractInfo?: ContractInfo;
              stakingPools?: StakingPool[];
              addressAliases?: { [key: string]: AddressAlias };
          };
          marker: undefined;
          stellarCursor: undefined;
          page: AccountInfo['page'];
      }
    | {
          networkType: 'solana';
          misc?: {
              rent?: number;
              solStakingAccounts?: SolanaStakingAccount[];
              solEpoch?: number;
              owner?: string;
          };
          marker: undefined;
          stellarCursor: undefined;
          page: AccountInfo['page'];
      }
    | {
          networkType: 'stellar';
          misc: { stellarSequence: string; reserve: string };
          marker: undefined;
          stellarCursor: AccountInfo['stellarCursor'];
          page: undefined;
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

export type AccountFailureSpecific =
    | { failed: true; error: string }
    | { failed?: false; error?: undefined };

/**
 * This is synthetic (combined) key, it may be useful for some data-structures.
 *
 * @deprecated For domain structures (entities, storage & API of components/functions)
 *             prefer the separate `AccountDescriptor`, `NetworkSymbol` and `DeviceStaticSessionId`
 */
export type AccountKey = string; // <AccountDescriptor>-<NetworkSymbol>-<DeviceStaticSessionId>

/**
 * Descriptor or xpub/zpub/..
 */
export type AccountDescriptor = string & Branded<'AccountDescriptor'>;
export const asAccountDescriptor = (value: string) => value as AccountDescriptor;

export type AccountBase = {
    deviceState: StaticSessionId;
    key: AccountKey;
    index: number;
    path: Bip43Path;
    unlockPath?: PROTO.UnlockPath; // parameter used to unlock SLIP-25/coinjoin keychain
    descriptor: AccountDescriptor;
    descriptorChecksum?: string;
    accountType: AccountType;
    symbol: NetworkSymbol;
    empty: boolean;
    visible: boolean;
    imported?: boolean;
    balance: string;
    availableBalance: string;
    formattedBalance: string;
    tokens: AccountInfo['tokens'];

    /**
     * This is Blockbook Data, they may change over time. They even can be removed in case
     * of blockchain rollback. And they can move from unused to used.
     *
     * Thus, we cannot enhance this with metadata.
     */
    addresses?: AccountInfo['addresses'];

    /**
     * (Meta)-data for address that are not Blockbook based (and may be synced over Suite-Sync).
     */
    addressExtra?: Array<{
        address: string;
        label: string | null;
    }>;

    utxo: AccountInfo['utxo'];
    history: AccountInfo['history'];
    metadata: AccountEntityKeys;
    /**
     * This is used for both legacy Native (on device only) Labeling & SuiteSync
     * We need migration for data here: https://github.com/trezor/trezor-suite/issues/20816
     */
    accountLabel?: string;
    isHidden?: boolean;
    ts: number;
};

export type Account = AccountBase &
    AccountBackendSpecific &
    AccountNetworkSpecific &
    AccountFailureSpecific;

export type FailedAccount = Extract<Account, { failed: true }>;
export type SuccessfulAccount = Extract<Account, { failed?: false }>;

export type UppercaseAccountType = Uppercase<AccountType>;

export type WalletParams =
    | NonNullable<{
          symbol: NetworkSymbol;
          accountIndex: number;
          accountType: AccountType | 'normal';
          contractAddress?: string;
      }>
    | undefined;

export interface ReceiveInfo {
    path: string;
    address: string;
    isVerified: boolean;
}

export interface StakingPoolExtended extends StakingPool {
    totalPendingStakeBalance: string;
    canClaim: boolean;
}
