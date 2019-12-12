import React from 'react';
import styled from 'styled-components';
import { Network, Account } from '@wallet-types';
import { NETWORKS } from '@suite/config/wallet';
import Asset from './components/Asset';
import Card from '../Card';
import BigNumber from 'bignumber.js';
import { AppState } from '@suite/types/suite';
import { toFiatCurrency } from '@suite/utils/wallet/fiatConverterUtils';
import { Loader } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
`;

const Header = styled.div`
    display: flex;
    background-color: #f5f5f5;
    padding: 10px 20px;
`;

const HeaderTitle = styled.div`
    flex: 1;
    font-size: 12px;
    font-weight: 600;
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
}

const AssetsCard = ({ assets, localCurrency, rates, isLoading, ...rest }: Props) => {
    return (
        <StyledCard>
            <Header>
                <HeaderTitle>
                    {/* todo */}
                    <div>Assets</div>
                    <div>Values</div>
                    <div />
                    <div>Exchange rate</div>
                    <div />
                </HeaderTitle>
            </Header>
            {console.log('assets', assets)}
            {isLoading && (
                <InfoMessage>
                    <Loader size={20} />
                </InfoMessage>
            )}
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
                        cryptoValue={assetBalance.toString()}
                        fiatValue={fiatvalue}
                        exchangeRate={localCurrencyRate}
                        localCurrency={localCurrency}
                    />
                );
            })}
        </StyledCard>
    );
};

export default AssetsCard;
