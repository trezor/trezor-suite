import { buildApprove } from './builder/evm/approve';
import { buildDeposit } from './builder/evm/deposit';
import { buildRedeem } from './builder/evm/redeem';
import { buildTransfer } from './builder/evm/transfer';
import { buildWithdraw } from './builder/evm/withdraw';
import { buildTrc20Transfer } from './builder/tron/trc20/transfer';

export const Calldata = {
    evm: {
        erc20: {
            approve: buildApprove,
            transfer: buildTransfer,
        },
        erc4626: {
            deposit: buildDeposit,
            withdraw: buildWithdraw,
            redeem: buildRedeem,
        },
    },
    tron: {
        trc20: {
            transfer: buildTrc20Transfer,
        },
    },
} as const;
