import { EVM_ABI } from './constants/evm';
import { createVerifier } from './verifier/createVerifier';

type VerifierApi = {
    evm: {
        erc20: {
            allowance: ReturnType<typeof createVerifier<typeof EVM_ABI.erc20.allowance>>;
            approve: ReturnType<typeof createVerifier<typeof EVM_ABI.erc20.approve>>;
        };
        erc4626: {
            deposit: ReturnType<typeof createVerifier<typeof EVM_ABI.erc4626.deposit>>;
            withdraw: ReturnType<typeof createVerifier<typeof EVM_ABI.erc4626.withdraw>>;
            redeem: ReturnType<typeof createVerifier<typeof EVM_ABI.erc4626.redeem>>;
        };
        distributor: {
            claim: ReturnType<typeof createVerifier<typeof EVM_ABI.distributor.claim>>;
        };
        everstake: {
            stake: ReturnType<typeof createVerifier<typeof EVM_ABI.everstake.stake>>;
            unstake: ReturnType<typeof createVerifier<typeof EVM_ABI.everstake.unstake>>;
            claimWithdrawRequest: ReturnType<
                typeof createVerifier<typeof EVM_ABI.everstake.claimWithdrawRequest>
            >;
        };
    };
};

export const Verifier: VerifierApi = {
    evm: {
        erc20: {
            allowance: createVerifier({ abi: EVM_ABI.erc20.allowance }),
            approve: createVerifier({ abi: EVM_ABI.erc20.approve }),
        },
        erc4626: {
            deposit: createVerifier({ abi: EVM_ABI.erc4626.deposit }),
            withdraw: createVerifier({ abi: EVM_ABI.erc4626.withdraw }),
            redeem: createVerifier({ abi: EVM_ABI.erc4626.redeem }),
        },
        distributor: {
            claim: createVerifier({ abi: EVM_ABI.distributor.claim }),
        },
        everstake: {
            stake: createVerifier({ abi: EVM_ABI.everstake.stake }),
            unstake: createVerifier({ abi: EVM_ABI.everstake.unstake }),
            claimWithdrawRequest: createVerifier({ abi: EVM_ABI.everstake.claimWithdrawRequest }),
        },
    },
};
