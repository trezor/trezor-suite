export type PrecomposedTransactionXrp =
    | {
          type: 'error';
          error: string;
      }
    | {
          type: 'final';
          //   max: string;
          totalSpent: string;
          fee: string;
          //   feePerByte: string;
          //   bytes: number;
      };
