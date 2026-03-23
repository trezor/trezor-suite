import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { type InternalTransfer, type TokenTransfer } from '@trezor/blockchain-link-types';

import type { TokenDefinitions } from '../tokenDefinitionsTypes';

export interface TokenTransferWithFiatAmount extends TokenTransfer {
    amountInFiat?: string;
}

export interface InternalTransferWithFiatAmount extends InternalTransfer {
    amountInFiat?: string;
}

export interface TransactionWithFiatAmount extends WalletAccountTransaction {
    amountInFiat?: string;
    tokens: TokenTransferWithFiatAmount[];
    internalTransfers: InternalTransferWithFiatAmount[];
}

type PhishingDetectorFnProps = {
    transaction: TransactionWithFiatAmount;
    tokenDefinitions?: TokenDefinitions;
    dustThreshold?: string;
};

export interface PhishingDetectorResult {
    isPhishing: boolean;
    transaction?: TransactionWithFiatAmount;
}

export type PhishingDetectorFn = (props: PhishingDetectorFnProps) => PhishingDetectorResult;
