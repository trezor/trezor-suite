import { Network } from '@wallet-types';

export const getDefaultBackendType = (coin: Network['symbol']) => {
    if (coin === 'ada' || coin === 'tada') {
        return 'blockfrost';
    }
    return 'blockbook';
};

const electrumUrlRegex = /^([a-zA-Z0-9.-]+):[0-9]{1,5}:[ts]$/; // URL is in format host:port:[t|s] (t for tcp, s for ssl)

export const isElectrumUrl = (value: string) => electrumUrlRegex.test(value);

export const getElectrumHost = (value: string) => electrumUrlRegex.exec(value)?.[1];
