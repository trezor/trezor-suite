import styled from 'styled-components';

import { Card, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CoinmarketFormInputs } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInputs';
import { CoinmarketFormOffer } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffer';
import { CoinmarketFeaturedOffers } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffers';
import { CoinmarketWrapper } from 'src/views/wallet/coinmarket/common/CoinmarketWrapper';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';
import { useCoinmarketDeviceDisconnected } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketDeviceDisconnected';

const CoinmarketFormLayoutWrapper = styled.form`
    ${CoinmarketWrapper}
`;

export const CoinmarketFormLayout = () => {
    const { coinmarketDeviceDisconnected } = useCoinmarketDeviceDisconnected();

    return (
        <Column gap={spacings.md} data-testid="@coinmarket/form">
            {coinmarketDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <CoinmarketFormLayoutWrapper>
                <Card>
                    <Column gap={spacings.lg}>
                        <CoinmarketFormInputs />
                    </Column>
                </Card>
                <Card>
                    <CoinmarketFormOffer />
                </Card>
            </CoinmarketFormLayoutWrapper>
            <CoinmarketFeaturedOffers />
        </Column>
    );
};
