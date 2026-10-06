import { type NetworkType } from '@suite-common/wallet-config';

type NormalizeDexTransactionDataParams = {
    data: string;
    networkType: NetworkType;
};

export const normalizeDexTransactionData = ({
    data,
    networkType,
}: NormalizeDexTransactionDataParams): string =>
    networkType === 'solana' ? Buffer.from(data, 'base64').toString('hex') : data;
