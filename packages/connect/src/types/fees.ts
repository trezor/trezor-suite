export interface FeeInfo {
    blockTime: number;
    minFee: number;
    maxFee: number;
    dustLimit: number;
}

export interface FeeLevel {
    label: 'high' | 'normal' | 'economy' | 'low' | 'custom';
    feePerUnit: string;
    blocks: number;
    feeLimit?: string; // eth gas limit
    feePerTx?: string; // fee for BlockchainEstimateFeeParams.request.specific
}

export type SelectFeeLevel =
    | {
          name: string;
          fee: '0';
          feePerByte?: undefined;
          disabled: true;
      }
    | {
          name: string;
          fee: string;
          feePerByte: string;
          minutes: number;
          total: string;
      };
