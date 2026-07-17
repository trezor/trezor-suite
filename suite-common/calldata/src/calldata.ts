import { buildAllowance } from './builder/evm/allowance';
import { buildApprove } from './builder/evm/approve';
import { buildClaim } from './builder/evm/claim';
import { buildDeposit } from './builder/evm/deposit';
import { buildClaimWithdrawRequest } from './builder/evm/everstake/claimWithdrawRequest';
import { buildStake } from './builder/evm/everstake/stake';
import { buildUnstake } from './builder/evm/everstake/unstake';
import { buildRedeem } from './builder/evm/redeem';
import { buildTransfer } from './builder/evm/transfer';
import { buildWithdraw } from './builder/evm/withdraw';
import { buildTrc20Transfer } from './builder/tron/trc20/transfer';
import { EVM_ABI } from './constants/evm';
import { createEvmDecoder } from './decoder/evm';

type CalldataApi = {
    evm: {
        erc20: {
            allowance: { encode: typeof buildAllowance };
            approve: {
                encode: typeof buildApprove;
                decode: ReturnType<typeof createEvmDecoder<typeof EVM_ABI.erc20.approve>>;
            };
            transfer: {
                encode: typeof buildTransfer;
                decode: ReturnType<typeof createEvmDecoder<typeof EVM_ABI.erc20.transfer>>;
            };
        };
        erc4626: {
            deposit: {
                encode: typeof buildDeposit;
                decode: ReturnType<typeof createEvmDecoder<typeof EVM_ABI.erc4626.deposit>>;
            };
            withdraw: {
                encode: typeof buildWithdraw;
                decode: ReturnType<typeof createEvmDecoder<typeof EVM_ABI.erc4626.withdraw>>;
            };
            redeem: {
                encode: typeof buildRedeem;
                decode: ReturnType<typeof createEvmDecoder<typeof EVM_ABI.erc4626.redeem>>;
            };
        };
        distributor: {
            claim: {
                encode: typeof buildClaim;
                decode: ReturnType<typeof createEvmDecoder<typeof EVM_ABI.distributor.claim>>;
            };
        };
        everstake: {
            stake: { encode: typeof buildStake };
            unstake: { encode: typeof buildUnstake };
            claimWithdrawRequest: { encode: typeof buildClaimWithdrawRequest };
        };
    };
    tron: {
        trc20: {
            transfer: { encode: typeof buildTrc20Transfer };
        };
    };
};

export const Calldata: CalldataApi = {
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
            unstake: { encode: buildUnstake },
            claimWithdrawRequest: { encode: buildClaimWithdrawRequest },
        },
    },
    tron: {
        trc20: {
            transfer: { encode: buildTrc20Transfer },
        },
    },
};
