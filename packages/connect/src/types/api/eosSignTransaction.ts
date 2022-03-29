import type { Messages } from '@trezor/transport';
import type { Params, Response } from '../params';

export interface EosTxHeader {
    expiration: Messages.UintType;
    refBlockNum: number;
    refBlockPrefix: number;
    maxNetUsageWords: number;
    maxCpuUsageMs: number;
    delaySec: number;
}

export interface EosAuthorization {
    threshold: number;
    keys: Messages.EosAuthorizationKey[];
    accounts: Array<{
        permission: Messages.EosPermissionLevel;
        weight: number;
    }>;
    waits: Messages.EosAuthorizationWait[];
}

export interface EosTxActionCommon {
    account: string;
    authorization: Messages.EosPermissionLevel[];
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
          data: Messages.EosActionBuyRamBytes;
      })
    | (EosTxActionCommon & {
          name: 'sellram';
          data: Messages.EosActionSellRam;
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
          data: Messages.EosActionRefund;
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
          data: Messages.EosActionDeleteAuth;
      })
    | (EosTxActionCommon & {
          name: 'linkauth';
          data: Messages.EosActionLinkAuth;
      })
    | (EosTxActionCommon & {
          name: 'unlinkauth';
          data: Messages.EosActionUnlinkAuth;
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

export declare function eosSignTransaction(
    params: Params<EosSignTransaction>,
): Response<Messages.EosSignedTx>;
