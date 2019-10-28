export type PrecomposedTransactionXrp =
    | {
          type: 'error';
          error: string;
      }
    | {
          type: 'nonfinal';
          totalSpent: string;
          fee: string;
      }
    | {
          type: 'final';
          max: string;
          totalSpent: string;
          fee: string;
          //   feePerByte: string;
          //   bytes: number;
      };
