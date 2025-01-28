import binance from './binance';
import bitcoin from './bitcoin';
import blockchain from './blockchain';
import cardano from './cardano/index';
import eos from './eos';
import ethereum from './ethereum';
import management from './management';
import nem from './nem/index';
import other from './other';
import ripple from './ripple/index';
import solana from './solana';
import stellar from './stellar/index';
import tezos from './tezos';

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
    ...solana,
    ...other,
    ...management,
    ...blockchain,
];
