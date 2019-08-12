/* eslint-disable global-require */
import React from 'react';
import PropTypes from 'prop-types';

import AdaCoin from './coins/ada';
import BchCoin from './coins/bch';
import BtcCoin from './coins/btc';
import BtgCoin from './coins/btg';
import DashCoin from './coins/dash';
import DgbCoin from './coins/dgb';
import DogeCoin from './coins/doge';
import EtcCoin from './coins/etc';
import EthCoin from './coins/eth';
import LtcCoin from './coins/ltc';
import NemCoin from './coins/nem';
import NmcCoin from './coins/nmc';
import RinkebyCoin from './coins/rinkeby';
import TropCoin from './coins/trop';
import TxrpCoin from './coins/txrp';
import VtcCoin from './coins/vtc';
import XemCoin from './coins/xem';
import XlmCoin from './coins/xlm';
import XrpCoin from './coins/xrp';
import XtzCoin from './coins/xtz';
import ZecCoin from './coins/zec';

const LOGOS: { [key: string]: any } = {
    ada: AdaCoin,
    bch: BchCoin,
    btc: BtcCoin,
    btg: BtgCoin,
    dash: DashCoin,
    dgb: DgbCoin,
    doge: DogeCoin,
    etc: EtcCoin,
    eth: EthCoin,
    ltc: LtcCoin,
    nem: NemCoin,
    nmc: NmcCoin,
    rinkeby: RinkebyCoin,
    trop: TropCoin,
    txrp: TxrpCoin,
    vtc: VtcCoin,
    xem: XemCoin,
    xlm: XlmCoin,
    xrp: XrpCoin,
    xtz: XtzCoin,
    zec: ZecCoin,
};

interface Props {
    network: string;
    size: number | string;
}

const CoinLogo = ({ network, size = 32, ...rest }: Props) => {
    const Component = LOGOS[network];
    return <Component height={size} width={size} />;
};

CoinLogo.propTypes = {
    network: PropTypes.string,
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export { CoinLogo, Props as CoinLogoProps };
