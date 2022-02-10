import { Network } from '@wallet-types';

export const getDefaultBackendType = (coin: Network['symbol']) => {
    if (coin === 'ada' || coin === 'tada') {
        return 'blockfrost';
    }
    return 'blockbook';
};
