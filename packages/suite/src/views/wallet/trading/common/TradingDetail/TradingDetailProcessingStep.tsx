import { type ReactNode } from 'react';

import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import {
    type TradingProviderInfo,
    type TradingTradeType,
    type TradingType,
} from '@suite-common/trading';
import { Column, type StepListItemState } from '@trezor/components';

import { translationKeys } from 'src/utils/wallet/trading/tradingUtils';
import { TradingDetailProviderStatusLink } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProviderStatusLink';
import { TradingDetailStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailStep';
import { getTradingProviderName } from 'src/views/wallet/trading/common/TradingDetail/utils';

const getTitleId = (state: StepListItemState, isDex?: boolean): TranslationKey => {
    if (isDex) {
        return state === 'active'
            ? 'TR_TRADING_DETAIL_SWAPPING_ON_PROVIDER'
            : 'TR_TRADING_DETAIL_SWAPPED_ON_PROVIDER';
    }

    switch (state) {
        case 'active':
            return 'TR_TRADING_DETAIL_PROCESSING';
        case 'done':
            return 'TR_TRADING_DETAIL_PROCESSED';
        default:
            return 'TR_TRADING_DETAIL_WILL_PROCESS';
    }
};

type TradingDetailProcessingStepProps = {
    state: StepListItemState;
    tradeType: TradingType;
    trade: TradingTradeType;
    provider?: TradingProviderInfo;
    isDex?: boolean;
    children?: ReactNode;
};

export const TradingDetailProcessingStep = ({
    state,
    tradeType,
    trade,
    provider,
    isDex,
    children,
}: TradingDetailProcessingStepProps) => {
    const { translationString } = useTranslation();

    return (
        <TradingDetailStep
            state={state}
            title={
                <Translation
                    id={getTitleId(state, isDex)}
                    values={{
                        providerName: getTradingProviderName(provider),
                        type: translationString(translationKeys[tradeType]).toLowerCase(),
                    }}
                />
            }
        >
            <Column gap={12} alignItems="flex-start">
                {children}
                <TradingDetailProviderStatusLink
                    provider={provider}
                    trade={trade}
                    priority={state === 'active' ? 'primary' : 'secondary'}
                />
            </Column>
        </TradingDetailStep>
    );
};
