import bitcoin from './bitcoin';
import blockchain from './blockchain';
import cardano from './cardano/index';
import ethereum from './ethereum';
import management from './management';
import monero from './monero/index';
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
    ...cardano,
    ...tezos,
    ...monero,
    ...solana,
    ...other,
    ...management,
    ...blockchain,
];
