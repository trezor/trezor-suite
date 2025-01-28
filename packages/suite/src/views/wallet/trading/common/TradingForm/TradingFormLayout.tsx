import styled from 'styled-components';

import { Card, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useTradingDeviceDisconnected } from 'src/hooks/wallet/trading/form/common/useTradingDeviceDisconnected';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { TradingFeaturedOffers } from 'src/views/wallet/trading/common/TradingFeaturedOffers/TradingFeaturedOffers';
import { TradingFormInputs } from 'src/views/wallet/trading/common/TradingForm/TradingFormInputs';
import { TradingFormOffer } from 'src/views/wallet/trading/common/TradingForm/TradingFormOffer';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

const TradingFormLayoutWrapper = styled.form`
    ${TradingWrapper}
`;

export const TradingFormLayout = () => {
    const { tradingDeviceDisconnected } = useTradingDeviceDisconnected();

    return (
        <Column gap={spacings.md} data-testid="@trading/form">
            {tradingDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <TradingFormLayoutWrapper>
                <Card>
                    <Column gap={spacings.lg}>
                        <TradingFormInputs />
                    </Column>
                </Card>
                <Card>
                    <TradingFormOffer />
                </Card>
            </TradingFormLayoutWrapper>
            <TradingFeaturedOffers />
        </Column>
    );
};
