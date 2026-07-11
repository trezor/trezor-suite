import { buildAllowance } from './builder/evm/allowance';
import { buildApprove } from './builder/evm/approve';
import { buildClaim } from './builder/evm/claim';
import { buildDeposit } from './builder/evm/deposit';
import { buildClaimWithdrawRequest } from './builder/evm/everstake/claimWithdrawRequest';
import { buildStake } from './builder/evm/everstake/stake';
import { buildUnstake } from './builder/evm/everstake/unstake';
import { buildRedeem } from './builder/evm/redeem';
import { buildTransfer } from './builder/evm/transfer';
import { buildWethDeposit } from './builder/evm/weth/deposit';
import { buildWethWithdraw } from './builder/evm/weth/withdraw';
import { buildWithdraw } from './builder/evm/withdraw';
import { buildTrc20Transfer } from './builder/tron/trc20/transfer';
import { EVM_ABI } from './constants/evm';
import { createEvmDecoder } from './decoder/evm';

export const Calldata = {
    evm: {
        erc20: {
            allowance: { encode: buildAllowance },
            approve: {
                encode: buildApprove,
                decode: createEvmDecoder(EVM_ABI.erc20.approve),
            },
            transfer: {
                encode: buildTransfer,
                decode: createEvmDecoder(EVM_ABI.erc20.transfer),
            },
        },
        erc4626: {
            deposit: {
                encode: buildDeposit,
                decode: createEvmDecoder(EVM_ABI.erc4626.deposit),
            },
            withdraw: {
                encode: buildWithdraw,
                decode: createEvmDecoder(EVM_ABI.erc4626.withdraw),
            },
            redeem: {
                encode: buildRedeem,
                decode: createEvmDecoder(EVM_ABI.erc4626.redeem),
            },
        },
        distributor: {
            claim: {
                encode: buildClaim,
                decode: createEvmDecoder(EVM_ABI.distributor.claim),
            },
        },
        everstake: {
            stake: { encode: buildStake },
            unstake: {
                encode: buildUnstake,
                decode: createEvmDecoder(EVM_ABI.everstake.unstake),
            },
            claimWithdrawRequest: { encode: buildClaimWithdrawRequest },
        },
        weth: {
            deposit: {
                encode: buildWethDeposit,
                decode: createEvmDecoder(EVM_ABI.weth.deposit),
            },
            withdraw: {
                encode: buildWethWithdraw,
                decode: createEvmDecoder(EVM_ABI.weth.withdraw),
            },
        },
    },
    tron: {
        trc20: {
            transfer: { encode: buildTrc20Transfer },
        },
    },
} as const;
