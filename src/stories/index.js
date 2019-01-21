import React from 'react';

import { setAddon, storiesOf } from '@storybook/react';
// import { action } from '@storybook/addon-actions';

import ICONS from 'config/icons';

import JSXAddon from 'storybook-addon-jsx';
import ButtonText from 'components/buttons/ButtonText';
import ButtonWebUSB from 'components/buttons/ButtonWebUSB';
import Icon from 'components/Icon';
import Modal from 'components/Modal';
import {
    H1, H2, H3, H4,
} from 'components/Heading';
import CoinLogo from 'components/images/CoinLogo';
import TrezorImage from 'components/images/TrezorImage';
import WalletType from 'components/images/WalletType';

setAddon(JSXAddon);

storiesOf('Buttons', module)
    .addWithJSX('with text', () => (
        <ButtonText>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (disabled)', () => (
        <ButtonText isDisabled>Hello Button</ButtonText>
    ))
    .addWithJSX('transparent with text ', () => (
        <ButtonText isTransparent>Hello Button</ButtonText>
    ))
    .addWithJSX('with text (WebUSB)', () => (
        <ButtonWebUSB>Hello Button</ButtonWebUSB>
    ));

storiesOf('Heading', module)
    .addWithJSX('H1', () => <H1>Hello World!</H1>)
    .addWithJSX('H2', () => <H2>Hello World!</H2>)
    .addWithJSX('H3', () => <H3>Hello World!</H3>)
    .addWithJSX('H4', () => <H4>Hello World!</H4>);

storiesOf('Trezor image', module)
    .addWithJSX('Model One', () => <TrezorImage model="1" />)
    .addWithJSX('Model T', () => <TrezorImage model="T" />);

storiesOf('Wallet type', module)
    .addWithJSX('Model One', () => <WalletType type="standard" />)
    .addWithJSX('Model T', () => <WalletType type="hidden" />);

storiesOf('Coin logo', module)
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

storiesOf('Modal', module)
    .addWithJSX('Hello world!', () => {
        const modal = {
            content: <H1>Hello world!</H1>,
        };
        return (
            <Modal
                modal={modal}
            />
        );
    });

storiesOf('Icon', module)
    .addWithJSX('Top', () => <Icon icon={ICONS.TOP} />)
    .addWithJSX('Eye crossed', () => <Icon icon={ICONS.EYE_CROSSED} />)
    .addWithJSX('Eye', () => <Icon icon={ICONS.EYE} />)
    .addWithJSX('Checked', () => <Icon icon={ICONS.CHECKED} />)
    .addWithJSX('Back', () => <Icon icon={ICONS.BACK} />)
    .addWithJSX('Help', () => <Icon icon={ICONS.HELP} />)
    .addWithJSX('Refresh', () => <Icon icon={ICONS.REFRESH} />)
    .addWithJSX('T1', () => <Icon icon={ICONS.T1} />)
    .addWithJSX('Config', () => <Icon icon={ICONS.COG} />)
    .addWithJSX('Eject', () => <Icon icon={ICONS.EJECT} />)
    .addWithJSX('Close', () => <Icon icon={ICONS.CLOSE} />)
    .addWithJSX('Download', () => <Icon icon={ICONS.DOWNLOAD} />)
    .addWithJSX('Plus', () => <Icon icon={ICONS.PLUS} />)
    .addWithJSX('Arrow up', () => <Icon icon={ICONS.ARROW_UP} />)
    .addWithJSX('Arrow left', () => <Icon icon={ICONS.ARROW_LEFT} />)
    .addWithJSX('Arrow down', () => <Icon icon={ICONS.ARROW_DOWN} />)
    .addWithJSX('Chat', () => <Icon icon={ICONS.CHAT} />)
    .addWithJSX('Skip', () => <Icon icon={ICONS.SKIP} />)
    .addWithJSX('Warning', () => <Icon icon={ICONS.WARNING} />)
    .addWithJSX('Info', () => <Icon icon={ICONS.INFO} />)
    .addWithJSX('Error', () => <Icon icon={ICONS.ERROR} />)
    .addWithJSX('Success', () => <Icon icon={ICONS.SUCCESS} />);
