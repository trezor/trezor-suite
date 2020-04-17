import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';
import { NETWORKS } from '@wallet-config';
import Asset from './components/Asset';
import { Account } from '@wallet-types';
import { AppState } from '@suite-types';
import { colors, Loader } from '@trezor/components';
import { Card, Translation } from '@suite-components';
import { CARD_PADDING_SIZE } from '@suite/constants/suite/layout';

const Header = styled.div`
    display: flex;
    border-radius: 6px 6px 0px 0px;
    padding: 10px ${CARD_PADDING_SIZE};
`;

const HeaderTitle = styled.div`
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: ${colors.BLACK50};
    text-transform: uppercase;
    display: grid;
    grid-gap: 10px;
    grid-template-columns: minmax(180px, 2fr) repeat(auto-fit, minmax(80px, 1fr));
`;

const StyledAsset = styled(Asset)`
    & + & {
        border-top: 2px solid ${colors.BLACK96};
    }
`;

const StyledCard = styled(Card)`
    flex-direction: column;
    padding: 0px ${CARD_PADDING_SIZE};
`;

// padding for loader need to math with first row height
const InfoMessage = styled.div`
    padding: 14px 20px;
    padding-bottom: 15px;
    display: flex;
`;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    assets: { [key: string]: Account[] };
    localCurrency: string;
    rates: AppState['wallet']['fiat'];
    isLoading?: boolean;
}

const AssetsCard = ({ assets, localCurrency, rates, isLoading, ...rest }: Props) => {
    const networks = Object.keys(assets);
    return (
        <>
            <Header>
                <HeaderTitle>
                    {/* todo */}
                    <div>
                        <Translation id="TR_ASSETS" />
                    </div>
                    <div>
                        <Translation id="TR_VALUES" />
                    </div>
                    <div />
                    <div>
                        <Translation id="TR_EXCHANGE_RATE" />
                    </div>
                    <div />
                </HeaderTitle>
            </Header>
            <StyledCard {...rest}>
                {networks.map(symbol => {
                    const network = NETWORKS.find(n => n.symbol === symbol && !n.accountType);
                    if (!network) {
                        return 'unknown network';
                    }

                    const assetBalance = assets[symbol].reduce(
                        (prev, a) => prev.plus(a.formattedBalance),
                        new BigNumber(0),
                    );

                    return (
                        <StyledAsset
                            data-test="@dashboard/asset-card"
                            key={symbol}
                            name={network.name}
                            symbol={network.symbol}
                            cryptoValue={assetBalance.toFixed()}
                            localCurrency={localCurrency}
                        />
                    );
                })}
                {isLoading && networks.length < 1 && (
                    <InfoMessage>
                        <Loader size={20} />
                    </InfoMessage>
                )}
            </StyledCard>
        </>
    );
};

export default AssetsCard;
