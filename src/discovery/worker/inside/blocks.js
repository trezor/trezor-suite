/* @flow */
import type {
    AccountInfo,
} from '../../index';

import type {
    Block,
    BlockRange,
} from '../types';

import {
    lookupSyncStatus,
    lookupBlockHash,
} from './channel';

// Some helper functions for loading block status
// from blockchain

// from which to which block do I need to do discovery
// based on whether there was a reorg, detected by last height/hash
export function loadBlockRange(initialState: AccountInfo): Promise<BlockRange> {
    const pBlock: Block = initialState.lastBlock;

    // first, I ask for last block I will do
    return getCurrentBlock().then((last) => {
        // then I detect first block I will do
        // detect based on whether reorg is needed
        // I do not do reorgs inteligently, I always discard all
        const firstHeight: Promise<number> = pBlock.height !== 0

            ? getBlock(pBlock.height).then((block) => {
                if (block.hash === pBlock.hash) {
                    return pBlock.height;
                }
                console.warn('Blockhash mismatch', pBlock, block);
                return 0;
            }, (err) => {
                if (err.message === 'RPCError: Block height out of range') {
                    console.warn('Block height out of range', pBlock.height);
                    return 0;
                }
                throw err;
            })

            : Promise.resolve(0);
        return firstHeight.then(h => ({ firstHeight: h, last }));
    });
}

function getBlock(height: number): Promise<Block> {
    return lookupBlockHash(height)
        .then(hash => ({ hash, height }));
}

function getCurrentBlock(): Promise<Block> {
    return lookupSyncStatus()
        .then(height => getBlock(height));
}
