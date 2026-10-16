import { type ComponentType } from 'react';
import { useSelector } from 'react-redux';

import { selectIsDeviceCompromised } from '@suite/authenticity-checks';
import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import { type TradingType, useBoundTradingAccount } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { useMessageSystemTrading } from 'src/hooks/suite/useMessageSystemTrading';
import { TradingBuyFormWrapper } from 'src/views/wallet/trading/buy/TradingBuyFormWrapper';
import { TradingDisabled } from 'src/views/wallet/trading/common/TradingDisabled';
import { TradingExchangeFormWrapper } from 'src/views/wallet/trading/exchange/TradingExchangeFormWrapper';
import { TradingSellFormWrapper } from 'src/views/wallet/trading/sell/TradingSellFormWrapper';

type TradingFormEmbedProps = {
    type: TradingType;
    account: Account;
};

const formWrapperByType: Record<TradingType, ComponentType> = {
    buy: TradingBuyFormWrapper,
    sell: TradingSellFormWrapper,
    exchange: TradingExchangeFormWrapper,
};

const TradingFormEmbedForm = ({ type, account }: TradingFormEmbedProps) => {
    const isBoundToAccount = useBoundTradingAccount(type, account);
    const FormWrapper = formWrapperByType[type];

    return isBoundToAccount && <FormWrapper key={account.key} />;
};

export const TradingFormEmbed = ({ type, account }: TradingFormEmbedProps) => {
    const isDeviceCompromised = useSelector(selectIsDeviceCompromised);
    const { isDisabled, content } = useMessageSystemTrading(type);

    return (
        <Column gap={16} alignItems="stretch" minWidth={400}>
            <ContextMessage context={Context.getTrading(type)} />
            {isDisabled || isDeviceCompromised ? (
                <TradingDisabled type={type} content={content} />
            ) : (
                <TradingFormEmbedForm type={type} account={account} />
            )}
        </Column>
    );
};
