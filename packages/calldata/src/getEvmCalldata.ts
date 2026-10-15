import { type Calldata, type EvmCalldata } from './types/calldata';

export const getEvmCalldata = (calldata: Calldata | undefined): EvmCalldata => {
    if (!calldata?.evm) {
        throw new Error('EVM calldata is not supported by this network.');
    }

    return calldata;
};
