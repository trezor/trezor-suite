import React from 'react';
import styled from 'styled-components';
import BigNumber from 'bignumber.js';

import { NETWORKS } from '@wallet-config';
import Asset from './components/Asset';
import Card from '../Card';
import { Account } from '@wallet-types';
import { AppState } from '@suite-types';
import { toFiatCurrency } from '@wallet-utils/fiatConverterUtils';
import { Loader } from '@trezor/components';
import { colors } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const Header = styled.div`
    display: flex;
    background-color: #f5f5f5;
    border-radius: 6px 6px 0px 0px;
    padding: 10px 20px;
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
        border-top: 2px solid #f5f5f5;
    }
`;

const StyledCard = styled(Card)`
    flex-direction: column;
`;

const InfoMessage = styled.div`
    padding: 20px;
    display: flex;
    justify-content: center;
`;

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    assets: { [key: string]: Account[] };
    localCurrency: string;
    rates: AppState['wallet']['fiat'];
    isLoading?: boolean;
}

const AssetsCard = ({ assets, localCurrency, rates, isLoading, ...rest }: Props) => {
    return (
        <StyledCard {...rest}>
            <Header>
                <HeaderTitle>
                    {/* todo */}
                    <div>
                        <Translation {...messages.TR_ASSETS} />
                    </div>
                    <div>
                        <Translation {...messages.TR_VALUES} />
                    </div>
                    <div />
                    <div>
                        <Translation {...messages.TR_EXCHANGE_RATE} />
                    </div>
                    <div />
                </HeaderTitle>
            </Header>
            {Object.keys(assets).map(symbol => {
                const network = NETWORKS.find(n => n.symbol === symbol && !n.accountType);
                if (!network) {
                    return 'unknown network';
                }

                const assetBalance = assets[symbol].reduce(
                    (prev, a) => prev.plus(a.formattedBalance),
                    new BigNumber(0),
                );

                const fiatRates = rates.find(f => f.symbol === symbol);
                const localCurrencyRate = fiatRates
                    ? toFiatCurrency('1', localCurrency, fiatRates)
                    : null;
                const fiatvalue = assetBalance.multipliedBy(localCurrencyRate || 0);

                return (
                    <StyledAsset
                        key={symbol}
                        name={network.name}
                        symbol={network.symbol}
                        cryptoValue={assetBalance.toFixed()}
                        fiatValue={fiatvalue}
                        exchangeRate={localCurrencyRate}
                        localCurrency={localCurrency}
                    />
                );
            })}
            {isLoading && (
                <InfoMessage>
                    <Loader size={20} />
                </InfoMessage>
            )}
        </StyledCard>
    );
};

export default AssetsCard;
