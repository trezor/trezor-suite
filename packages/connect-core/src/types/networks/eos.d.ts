import {
    UintType,
    EosPermissionLevel,
    EosAuthorizationKey,
    EosActionBuyRamBytes,
    EosActionSellRam,
    EosActionRefund,
    EosActionDeleteAuth,
    EosActionLinkAuth,
    EosActionUnlinkAuth,
    EosAuthorizationWait,
} from '@trezor/protobuf';

// get public key

export interface EosGetPublicKey {
    path: string | number[];
    showOnTrezor?: boolean;
}

export interface EosPublicKey {
    wifPublicKey: string;
    rawPublicKey: string;
    path: number[];
    serializedPath: string;
}

// sign tx

export interface EosTxHeader {
    expiration: UintType;
    refBlockNum: number;
    refBlockPrefix: number;
    maxNetUsageWords: number;
    maxCpuUsageMs: number;
    delaySec: number;
}

export interface EosAuthorization {
    threshold: number;
    keys: EosAuthorizationKey[];
    accounts: Array<{
        permission: EosPermissionLevel;
        weight: number;
    }>;
    waits: EosAuthorizationWait[];
}

export interface EosTxActionCommon {
    account: string;
    authorization: EosPermissionLevel[];
}

export type EosTxAction =
    | (EosTxActionCommon & {
          name: 'transfer';
          data: {
              from: string;
              to: string;
              quantity: string;
              memo: string;
          };
      })
    | (EosTxActionCommon & {
          name: 'delegatebw';
          data: {
              from: string;
              receiver: string;
              stake_net_quantity: string;
              stake_cpu_quantity: string;
              transfer: boolean;
          };
      })
    | (EosTxActionCommon & {
          name: 'undelegatebw';
          data: {
              from: string;
              receiver: string;
              unstake_net_quantity: string;
              unstake_cpu_quantity: string;
          };
      })
    | (EosTxActionCommon & {
          name: 'buyram';
          data: {
              payer: string;
              receiver: string;
              quant: string;
          };
      })
    | (EosTxActionCommon & {
          name: 'buyrambytes';
          data: EosActionBuyRamBytes;
      })
    | (EosTxActionCommon & {
          name: 'sellram';
          data: EosActionSellRam;
      })
    | (EosTxActionCommon & {
          name: 'voteproducer';
          data: {
              voter: string;
              proxy: string;
              producers: string[];
          };
      })
    | (EosTxActionCommon & {
          name: 'refund';
          data: EosActionRefund;
      })
    | (EosTxActionCommon & {
          name: 'updateauth';
          data: {
              account: string;
              permission: string;
              parent: string;
              auth: EosAuthorization;
          };
      })
    | (EosTxActionCommon & {
          name: 'deleteauth';
          data: EosActionDeleteAuth;
      })
    | (EosTxActionCommon & {
          name: 'linkauth';
          data: EosActionLinkAuth;
      })
    | (EosTxActionCommon & {
          name: 'unlinkauth';
          data: EosActionUnlinkAuth;
      })
    | (EosTxActionCommon & {
          name: 'newaccount';
          data: {
              creator: string;
              name: string;
              owner: EosAuthorization;
              active: EosAuthorization;
          };
      });

// | EosTxActionCommon & {
//     name: string;
//     data: string;
// };

export interface EosSDKTransaction {
    chainId: string;
    header: EosTxHeader;
    actions: Array<EosTxAction | (EosTxActionCommon & { name: string; data: string })>;
    // actions: EosTxAction[];
}

export interface EosSignTransaction {
    path: string | number[];
    transaction: EosSDKTransaction;
}
