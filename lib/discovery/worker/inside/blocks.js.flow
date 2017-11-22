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

export function loadBlockRange(initialState: AccountInfo): Promise<BlockRange> {
    const pBlock: Block = initialState.lastBlock;

    return getBlock(0).then(nullBlock => {
        return getCurrentBlock().then(last => {
            const first: Promise<Block> = pBlock.height !== 0

                ? getBlock(pBlock.height).then((block) => {
                    if (block.hash === pBlock.hash) {
                        return block;
                    } else {
                        console.warn('Blockhash mismatch', pBlock, block);
                        return nullBlock;
                    }
                }, (err) => {
                    if (err.message === 'RPCError: Block height out of range') {
                        console.warn('Block height out of range', pBlock.height);
                        return nullBlock;
                    }
                    throw err;
                })

                : Promise.resolve(nullBlock);

            return Promise.all([first, last])
                          .then(([first, last]) => ({ first, last, nullBlock }));
        });
    });
}

function getBlock(height: number): Promise<Block> {
    return lookupBlockHash(height)
                      .then((hash) => ({ hash, height }));
}

function getCurrentBlock(): Promise<Block> {
    return lookupSyncStatus()
                     .then((height) => { return getBlock(height); });
}

