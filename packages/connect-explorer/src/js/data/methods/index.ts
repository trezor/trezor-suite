import bitcoin from './bitcoin';
import ethereum from './ethereum';
import ripple from './ripple/index';
import stellar from './stellar/index';
import nem from './nem/index';
import cardano from './cardano/index';
import tezos from './tezos';
import eos from './eos';
import binance from './binance';
import other from './other';

import management from './management';
import blockchain from './blockchain';

export default [
    ...bitcoin,
    ...ethereum,
    ...ripple,
    ...stellar,
    ...nem,
    ...cardano,
    ...tezos,
    ...eos,
    ...binance,
    ...other,
    ...management,
    ...blockchain,
];
