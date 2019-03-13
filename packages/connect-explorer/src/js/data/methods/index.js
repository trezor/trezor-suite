/* @flow */

import bitcoin from './bitcoin';
import ethereum from './ethereum';
import ripple from './ripple/index';
import stellar from './stellar/index';
import nem from './nem/index';
import cardano from './cardano/index';
import lisk from './lisk';
import tezos from './tezos';
import other from './other';

import management from './management';

export default [
    ...bitcoin,
    ...ethereum,
    ...ripple,
    ...stellar,
    ...nem,
    ...cardano,
    ...lisk,
    ...tezos,
    ...other,
    ...management
];


