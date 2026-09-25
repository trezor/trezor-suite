import { type CryptoId } from 'invity-api';

export type TradingVerifyFormProps = {
    address?: string;
    extraField?: string;
};

export type TradingVerifyAccountProps = {
    cryptoId: CryptoId | undefined;
    nonSuiteAccount: boolean;
};
