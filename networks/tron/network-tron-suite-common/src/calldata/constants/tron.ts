import { type TronFunctionAbi } from '../types/tron';

export const TRON_ABI = {
    trc20: {
        transfer: {
            selector: 'a9059cbb',
            inputs: [
                { name: 'to', type: 'tron_address' },
                { name: 'amount', type: 'uint256' },
            ],
        },
    },
} as const satisfies Record<string, Record<string, TronFunctionAbi>>;
