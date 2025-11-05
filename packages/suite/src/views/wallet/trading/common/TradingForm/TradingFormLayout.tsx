import { ReactNode } from 'react';

import styled from 'styled-components';

import { Context } from '@suite-common/message-system';
import { Card, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingFeaturedOffers } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffers';
import { TradingFormOffer } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { ReceiveAddressModalControlsProvider } from '../TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

const TradingFormLayoutWrapper = styled.form`
    ${TradingWrapper}
`;

interface TradingFormLayoutProps {
    children: ReactNode;
}

export const TradingFormLayout = ({ children }: TradingFormLayoutProps) => {
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    return (
        <Column gap={spacings.md} data-testid="@trading/form">
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <TradingFormLayoutWrapper>
                <ReceiveAddressModalControlsProvider>
                    {children}
                    <Card>
                        <TradingFormOffer />
                    </Card>
                </ReceiveAddressModalControlsProvider>
            </TradingFormLayoutWrapper>
            <ContextMessage context={Context.getLegal('gateway')} />
            <TradingFeaturedOffers />
        </Column>
    );
};
