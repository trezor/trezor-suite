import { type Calldata, type TronCalldata } from './types/calldata';

export const getTronCalldata = (calldata: Calldata | undefined): TronCalldata => {
    if (!calldata?.tron) {
        throw new Error('Tron calldata is not supported by this network.');
    }

    return calldata;
};
