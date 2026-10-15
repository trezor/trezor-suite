import { type EvmCalldata } from '@trezor/calldata';

import { Calldata } from './calldata/calldata';
import { getEvmClearSignedSwapCoverage, isEvmClearSigningTx } from './calldata/clearSigning';
import { decodeClearSignedSwap } from './calldata/clearSigningSwap';
import { EVM_ABI } from './calldata/constants/evm';
import { asEvmAddress } from './calldata/types/evm';
import { Verifier } from './calldata/verifier';

const calldata: EvmCalldata = {
    ...Calldata,
    Verifier,
    EVM_ABI,
    asEvmAddress,
    isEvmClearSigningTx,
    getEvmClearSignedSwapCoverage,
    decodeClearSignedSwap,
};

export const getEthereumCalldata = (): EvmCalldata => calldata;
