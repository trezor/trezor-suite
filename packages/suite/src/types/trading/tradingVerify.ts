import { type CryptoId } from 'invity-api';

import { type ExtendedMessageDescriptor } from '@suite/intl';

export interface TradingVerifyFormProps {
    address?: string;
    extraField?: string;
}

export interface TradingVerifyAccountProps {
    cryptoId: CryptoId | undefined;
    nonSuiteAccount: boolean;
}

export interface TradingGetTranslationIdsProps {
    accountTooltipTranslationId: ExtendedMessageDescriptor['id'];
    addressTooltipTranslationId: ExtendedMessageDescriptor['id'];
}
