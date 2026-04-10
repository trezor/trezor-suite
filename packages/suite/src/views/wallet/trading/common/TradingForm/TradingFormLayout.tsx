import { type ReactNode } from 'react';

import { selectInvityServerEnvironment } from '@suite/settings';
import { TradingEnvironmentWarning } from '@suite/trading';
import { Context } from '@suite-common/message-system';
import { Box, Card, Column } from '@trezor/components';
import { breakpoints, spacings } from '@trezor/theme';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useSelector } from 'src/hooks/suite';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingBuyFormOffer } from 'src/views/wallet/trading/buy/TradingBuyFormOffer';
import { TradingFeaturedOffers } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffers';
import { TradingExchangeFormOffer } from 'src/views/wallet/trading/exchange/TradingExchangeFormOffer';
import { TradingSellFormOffer } from 'src/views/wallet/trading/sell/TradingSellFormOffer';

import { ContentFlex } from '../../../../../support/suite/ContentFlex';
import { ReceiveAddressModalControlsProvider } from '../TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

interface TradingFormLayoutProps {
    children: ReactNode;
}

export const TradingFormLayout = ({ children }: TradingFormLayoutProps) => {
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();
    const invityServerEnvironment = useSelector(selectInvityServerEnvironment);
    const { type } = useTradingFormContext();

    return (
        <Column gap={spacings.md} data-testid="@trading/form">
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}
            <TradingEnvironmentWarning tradingEnvironment={invityServerEnvironment} />

            {/* If clicking on disabled input, the click propagates to the form and submits it (some form values are then pushed to URL search params) */}
            <form onSubmit={e => e.preventDefault()}>
                <ReceiveAddressModalControlsProvider>
                    <ContentFlex gap={16} breakpoint={breakpoints.tablet} alignItems="stretch">
                        <Box flex="2">{children}</Box>
                        <Card flex="1">
                            {(() => {
                                switch (type) {
                                    case 'buy':
                                        return <TradingBuyFormOffer />;
                                    case 'sell':
                                        return <TradingSellFormOffer />;
                                    case 'exchange':
                                        return <TradingExchangeFormOffer />;
                                    default:
                                        return type satisfies never;
                                }
                            })()}
                        </Card>
                    </ContentFlex>
                </ReceiveAddressModalControlsProvider>
            </form>
            <ContextMessage context={Context.getLegal('gateway')} />
            <TradingFeaturedOffers />
        </Column>
    );
};
