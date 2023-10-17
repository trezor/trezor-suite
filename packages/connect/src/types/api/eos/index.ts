import type { PROTO } from '../../../constants';
import type { DerivationPath } from '../../params';

// eosGetPublicKey

export interface EosPublicKey {
    wifPublicKey: string;
    rawPublicKey: string;
    path: number[];
    serializedPath: string;
}

// eosSignTransaction

export interface EosTxHeader {
    expiration: PROTO.UintType;
    refBlockNum: number;
    refBlockPrefix: number;
    maxNetUsageWords: number;
    maxCpuUsageMs: number;
    delaySec: number;
}

export interface EosAuthorization {
    threshold: number;
    keys: PROTO.EosAuthorizationKey[];
    accounts: {
        permission: PROTO.EosPermissionLevel;
        weight: number;
    }[];
    waits: PROTO.EosAuthorizationWait[];
}

export interface EosTxActionCommon {
    account: string;
    authorization: PROTO.EosPermissionLevel[];
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
          data: PROTO.EosActionBuyRamBytes;
      })
    | (EosTxActionCommon & {
          name: 'sellram';
          data: PROTO.EosActionSellRam;
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
          data: PROTO.EosActionRefund;
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
          data: PROTO.EosActionDeleteAuth;
      })
    | (EosTxActionCommon & {
          name: 'linkauth';
          data: PROTO.EosActionLinkAuth;
      })
    | (EosTxActionCommon & {
          name: 'unlinkauth';
          data: PROTO.EosActionUnlinkAuth;
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
    path: DerivationPath;
    transaction: EosSDKTransaction;
    chunkify?: boolean;
}
