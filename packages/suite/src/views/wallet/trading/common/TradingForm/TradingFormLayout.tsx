import { type ReactNode } from 'react';

import { ContextMessage } from '@suite/message-system';
import { selectTradeServerEnvironment } from '@suite/settings';
import { selectIsTorEnabled } from '@suite/tor';
import { TradingEnvironmentWarning } from '@suite/trading';
import { Context } from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import { Column } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingFormOfferBuyActions } from 'src/views/wallet/trading/buy/TradingFormOfferBuyActions';
import { TradingUtilsTorWarning } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsTorWarning';
import { useTradingSelectedQuote } from 'src/views/wallet/trading/common/hooks/useTradingSelectedQuote';
import { TradingFormOfferExchangeActions } from 'src/views/wallet/trading/exchange/TradingFormOfferExchangeActions';
import { TradingFormOfferSellActions } from 'src/views/wallet/trading/sell/TradingFormOfferSellActions';

import { TradingFormOfferWarnings } from './TradingFormOffer/components/TradingFormOffersWarnings';
import { ReceiveAddressModalControlsProvider } from '../TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

type TradingFormLayoutProps = {
    children: ReactNode;
};

const getActionsComponent = (type: TradingType) => {
    switch (type) {
        case 'buy':
            return <TradingFormOfferBuyActions />;
        case 'sell':
            return <TradingFormOfferSellActions />;
        case 'exchange':
            return <TradingFormOfferExchangeActions />;
        default:
            return exhaustive(type);
    }
};

export const TradingFormLayout = ({ children }: TradingFormLayoutProps) => {
    const tradeServerEnvironment = useSelector(selectTradeServerEnvironment);
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const {
        type,
        form: { state },
    } = useTradingFormContext();
    const quote = useTradingSelectedQuote(type);
    const noOffersWithTor = isTorEnabled && !quote && !state.isFormLoading;

    return (
        <Column
            gap={16}
            width="100%"
            maxWidth={400}
            alignSelf="center"
            alignItems="stretch"
            data-testid="@trading/form"
        >
            <TradingEnvironmentWarning tradingEnvironment={tradeServerEnvironment} />

            {/* If clicking on disabled input, the click propagates to the form and submits it (some form values are then pushed to URL search params) */}
            <form onSubmit={e => e.preventDefault()}>
                <ReceiveAddressModalControlsProvider>
                    <Column gap={16} alignItems="stretch">
                        {children}
                        <TradingFormOfferWarnings hasQuote={!!quote} />
                        {noOffersWithTor && (
                            <TradingUtilsTorWarning tradingType={type} noOffer={!quote} />
                        )}
                        {getActionsComponent(type)}
                    </Column>
                </ReceiveAddressModalControlsProvider>
            </form>
            <ContextMessage context={Context.getLegal('gateway')} />
        </Column>
    );
};
