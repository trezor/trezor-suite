import { type ComponentType } from 'react';
import { useSelector } from 'react-redux';

import { ContextMessage } from '@suite/message-system';
import { selectIsRegionRestricted } from '@suite/regions';
import { Context, selectIsAllTradingDisabled } from '@suite-common/message-system';
import { type TradingType, useBoundTradingAccount } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { TradingBuyFormWrapper } from '#src/views/wallet/trading/buy/TradingBuyFormWrapper';
import { TradingAvailabilityGuard } from '#src/views/wallet/trading/common/TradingAvailabilityGuard/TradingAvailabilityGuard';
import { TradingTypeTabs } from '#src/views/wallet/trading/common/TradingTypeTabs/TradingTypeTabs';
import { TradingExchangeFormWrapper } from '#src/views/wallet/trading/exchange/TradingExchangeFormWrapper';
import { TradingSellFormWrapper } from '#src/views/wallet/trading/sell/TradingSellFormWrapper';

type TradingFormEmbedProps = {
    type: TradingType;
    account: Account;
    onTypeChange?: (type: TradingType) => void;
};

const formWrapperByType: Record<TradingType, ComponentType> = {
    buy: TradingBuyFormWrapper,
    sell: TradingSellFormWrapper,
    exchange: TradingExchangeFormWrapper,
};

const TradingFormEmbedForm = ({ type, account }: Omit<TradingFormEmbedProps, 'onTypeChange'>) => {
    const isBoundToAccount = useBoundTradingAccount(type, account);
    const FormWrapper = formWrapperByType[type];

    return isBoundToAccount && <FormWrapper key={account.key} />;
};

export const TradingFormEmbed = ({ type, account, onTypeChange }: TradingFormEmbedProps) => {
    const isRegionRestricted = useSelector(selectIsRegionRestricted);
    const isAllTradingDisabled = useSelector(selectIsAllTradingDisabled);

    if (isRegionRestricted) {
        return null;
    }

    return (
        <Column gap={16} width="100%" maxWidth={400} alignSelf="center" alignItems="stretch">
            {onTypeChange && !isAllTradingDisabled && (
                <TradingTypeTabs activeType={type} size="large" onTypeChange={onTypeChange} />
            )}
            <ContextMessage context={Context.getTrading(type)} />
            <TradingAvailabilityGuard type={type}>
                <TradingFormEmbedForm type={type} account={account} />
            </TradingAvailabilityGuard>
        </Column>
    );
};
