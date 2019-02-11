import CoinLogo from 'components/images/CoinLogo';
import React from 'react';
import TrezorImage from 'components/images/TrezorImage';
import WalletType from 'components/images/WalletType';
import { storiesOf } from '@storybook/react';

storiesOf('Images', module)
    .addWithJSX('Model One', () => <TrezorImage model="1" />)
    .addWithJSX('Model T', () => <TrezorImage model="T" />)
    .addWithJSX('Standard wallet', () => <WalletType type="standard" />)
    .addWithJSX('Hidden wallet', () => <WalletType type="hidden" />);

storiesOf('Coins', module)
    .addWithJSX('ADA', () => <CoinLogo network="ada" />)
    .addWithJSX('BCH', () => <CoinLogo network="bch" />)
    .addWithJSX('BTC', () => <CoinLogo network="btc" />)
    .addWithJSX('BTG', () => <CoinLogo network="btg" />)
    .addWithJSX('DASH', () => <CoinLogo network="dash" />)
    .addWithJSX('DGB', () => <CoinLogo network="dgb" />)
    .addWithJSX('DOGE', () => <CoinLogo network="doge" />)
    .addWithJSX('ETC', () => <CoinLogo network="etc" />)
    .addWithJSX('ETH', () => <CoinLogo network="eth" />)
    .addWithJSX('LTC', () => <CoinLogo network="ltc" />)
    .addWithJSX('NEM', () => <CoinLogo network="nem" />)
    .addWithJSX('NMC', () => <CoinLogo network="nmc" />)
    .addWithJSX('RINKEBY', () => <CoinLogo network="rinkeby" />)
    .addWithJSX('TROP', () => <CoinLogo network="trop" />)
    .addWithJSX('TXRP', () => <CoinLogo network="txrp" />)
    .addWithJSX('VTC', () => <CoinLogo network="vtc" />)
    .addWithJSX('XEM', () => <CoinLogo network="xem" />)
    .addWithJSX('XLM', () => <CoinLogo network="xlm" />)
    .addWithJSX('XRP', () => <CoinLogo network="xrp" />)
    .addWithJSX('ZEC', () => <CoinLogo network="zec" />);
