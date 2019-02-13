import CoinLogo from 'components/images/CoinLogo';
import React from 'react';
import TrezorImage from 'components/images/TrezorImage';
import WalletType from 'components/images/WalletType';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import centered from '@storybook/addon-centered';
import { withInfo } from '@storybook/addon-info';

const Wrapper = styled.div`
`;

storiesOf('Coins', module)
    .addDecorator(centered)
    .addDecorator(
        withInfo({
            header: true,
            propTablesExclude: [Wrapper],
        }),
    )
    .add('coins', () => (
        <Wrapper>
            <CoinLogo network="ada" />
            <CoinLogo network="bch" />
            <CoinLogo network="btc" />
            <CoinLogo network="btg" />
            <CoinLogo network="dash" />
            <CoinLogo network="dgb" />
            <CoinLogo network="doge" />
            <CoinLogo network="etc" />
            <CoinLogo network="eth" />
            <CoinLogo network="ltc" />
            <CoinLogo network="nem" />
            <CoinLogo network="nmc" />
            <CoinLogo network="rinkeby" />
            <CoinLogo network="trop" />
            <CoinLogo network="txrp" />
            <CoinLogo network="vtc" />
            <CoinLogo network="xem" />
            <CoinLogo network="xlm" />
            <CoinLogo network="xrp" />
            <CoinLogo network="zec" />
        </Wrapper>
    ));
