import { bech32 } from '@scure/base';

import { type AdaPools } from '@suite-common/earn-staking-api';
import { EVERSTAKE_POOLS, FIVE_BINARIES_POOLS } from '@suite-common/wallet-config';

import { CARDANO_EVERSTAKE_DREP, CARDANO_EVERSTAKE_STAKING_POOL } from '../cardanoStakingConstants';

// Real Everstake pools; saturations mirror the live endpoint values of 2026-08-01.
const [eve6, eve7, eve8] = EVERSTAKE_POOLS as [string, string, string];
const EVE6_SATURATION = 80.77;
const EVE7_SATURATION = 76.42;
const EVE8_SATURATION = 62.64;

// A decodable pool id that is intentionally NOT in EVERSTAKE_POOLS.
const apiOnlyPool = bech32.encode('pool', bech32.toWords(new Uint8Array(28).fill(7)));

const pool = (id: string, saturation: number): AdaPools['pools'][number] => ({
    id,
    saturation,
    apy: 2.5,
});

const livePools = [
    pool(eve6, EVE6_SATURATION),
    pool(eve7, EVE7_SATURATION),
    pool(eve8, EVE8_SATURATION),
];

export const selectBestCardanoPool = [
    {
        description: 'no pool data (endpoint down) falls back to the hardcoded pool',
        pools: undefined,
        result: CARDANO_EVERSTAKE_STAKING_POOL.bech32,
    },
    {
        description: 'empty pool list falls back to the hardcoded pool',
        pools: [],
        result: CARDANO_EVERSTAKE_STAKING_POOL.bech32,
    },
    {
        description: 'least saturated pool is picked (live situation: EVE8)',
        pools: livePools,
        result: eve8,
    },
    {
        description: 'does not rely on the API ordering',
        pools: [
            pool(eve8, EVE8_SATURATION),
            pool(eve6, EVE6_SATURATION),
            pool(eve7, EVE7_SATURATION),
        ],
        result: eve8,
    },
    {
        description: 'all pools nearly full still yield the least saturated one',
        pools: [pool(eve6, 100), pool(eve7, 97.3), pool(eve8, 98.1)],
        result: eve7,
    },
    {
        description: 'single pool is picked',
        pools: [pool(eve6, EVE6_SATURATION)],
        result: eve6,
    },
];

export const selectBestCardanoPoolWithCurrentPool = [
    ...EVERSTAKE_POOLS.map((everstakePoolId, index) => ({
        description: `hardcoded Everstake pool [${index}] is kept even without any pool data`,
        pools: undefined,
        currentPoolId: everstakePoolId,
        result: everstakePoolId,
    })),
    {
        description: 'pool listed only by the endpoint is kept',
        pools: [pool(apiOnlyPool, 95.2), pool(eve8, EVE8_SATURATION)],
        currentPoolId: apiOnlyPool,
        result: apiOnlyPool,
    },
    {
        description: 'foreign pool is moved to the least saturated Everstake pool',
        pools: livePools,
        currentPoolId: 'pool1foreignforeignforeignforeignforeignforeignfore',
        result: eve8,
    },
    {
        description: 'foreign pool without pool data is moved to the hardcoded pool',
        pools: [],
        currentPoolId: 'pool1foreignforeignforeignforeignforeignforeignfore',
        result: CARDANO_EVERSTAKE_STAKING_POOL.bech32,
    },
    {
        description: 'account without delegation gets the least saturated pool',
        pools: livePools,
        currentPoolId: null,
        result: eve8,
    },
];

const cardanoAccount = (poolId?: string) => ({
    networkType: 'cardano',
    misc: { staking: { poolId } },
});

const [everstakePool] = EVERSTAKE_POOLS as [string];
const [fiveBinariesPool] = FIVE_BINARIES_POOLS as [string];
const foreignPool = 'pool1foreignforeignforeignforeignforeignforeignfore';
const fetchedPools = [pool(everstakePool, EVE6_SATURATION)];

export const isCardanoStakedWithEverstake = [
    {
        description: 'hardcoded Everstake pool without any pool data',
        account: cardanoAccount(everstakePool),
        pools: [],
        result: true,
    },
    {
        description: 'pool present only in the fetched list',
        account: cardanoAccount('pool1listedbyapi'),
        pools: [pool('pool1listedbyapi', 50)],
        result: true,
    },
    {
        description: 'foreign pool with pool data available',
        account: cardanoAccount(foreignPool),
        pools: fetchedPools,
        result: false,
    },
    {
        description: 'account without delegation',
        account: cardanoAccount(undefined),
        pools: fetchedPools,
        result: false,
    },
    {
        description: 'non-cardano account',
        account: { networkType: 'ethereum' },
        pools: fetchedPools,
        result: false,
    },
];

export const isCardanoStakedOutsideEverstake = [
    {
        description: 'foreign pool with pool data available',
        account: cardanoAccount(foreignPool),
        pools: fetchedPools,
        result: true,
    },
    {
        description: 'hardcoded Everstake pool with pool data available',
        account: cardanoAccount(everstakePool),
        pools: fetchedPools,
        result: false,
    },
    {
        description: 'hardcoded Everstake pool without pool data',
        account: cardanoAccount(everstakePool),
        pools: [],
        result: false,
    },
    {
        description: 'foreign pool without pool data (EVERSTAKE_POOLS is the complete set)',
        account: cardanoAccount(foreignPool),
        pools: [],
        result: true,
    },
    {
        description: 'Five Binaries pool without pool data',
        account: cardanoAccount(fiveBinariesPool),
        pools: [],
        result: true,
    },
    {
        description: 'Five Binaries pool with pool data available',
        account: cardanoAccount(fiveBinariesPool),
        pools: fetchedPools,
        result: true,
    },
    {
        description: 'account without delegation',
        account: cardanoAccount(undefined),
        pools: [],
        result: false,
    },
];

export const isCardanoStakedWithFiveBinaries = [
    {
        description: 'Five Binaries pool',
        account: cardanoAccount(fiveBinariesPool),
        result: true,
    },
    {
        description: 'Everstake pool',
        account: cardanoAccount(everstakePool),
        result: false,
    },
    {
        description: 'account without delegation',
        account: cardanoAccount(undefined),
        result: false,
    },
];

const cardanoAccountWithDrep = (drep: { drep_id: string } | null, isActive = true) => ({
    networkType: 'cardano',
    misc: { staking: { poolId: everstakePool, drep, isActive } },
});

export const hasCardanoLiveVoteDelegation = [
    {
        description: 'registered account voting for a DRep',
        account: cardanoAccountWithDrep({ drep_id: CARDANO_EVERSTAKE_DREP.bech32 }),
        result: true,
    },
    {
        description: 'registered account with no vote delegation',
        account: cardanoAccountWithDrep(null),
        result: false,
    },
    {
        description: 'unregistered account, whose reported DRep is stale',
        account: cardanoAccountWithDrep({ drep_id: CARDANO_EVERSTAKE_DREP.bech32 }, false),
        result: false,
    },
    {
        description: 'non-cardano account',
        account: { networkType: 'ethereum' },
        result: false,
    },
];
