export type EvmSelectedFee =
    | {
          type: 'eip1559';
          maxFeePerGas: string;
          maxPriorityFeePerGas: string;
          baseFeePerGas: string;
          gasLimit: string;
      }
    | {
          type: 'legacy';
          gasPrice: string;
          gasLimit: string;
      };
