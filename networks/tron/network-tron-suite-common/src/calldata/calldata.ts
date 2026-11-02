import { buildTrc20Transfer } from './builder/tron/trc20/transfer';

export const Calldata = {
    tron: {
        trc20: {
            transfer: { encode: buildTrc20Transfer },
        },
    },
} as const;
