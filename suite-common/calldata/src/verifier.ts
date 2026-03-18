import { EVM_ABI } from './constants/evm';
import { createVerifier } from './verifier/createVerifier';

export const Verifier = {
    evm: {
        erc20: {
            approve: createVerifier({ abi: EVM_ABI.erc20.approve }),
        },
        erc4626: {
            deposit: createVerifier({ abi: EVM_ABI.erc4626.deposit }),
            withdraw: createVerifier({ abi: EVM_ABI.erc4626.withdraw }),
            redeem: createVerifier({ abi: EVM_ABI.erc4626.redeem }),
        },
    },
} as const;
