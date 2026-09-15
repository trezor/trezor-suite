import { bech32 } from '@scure/base';

import { type AdaPools } from '@suite-common/earn-staking-api';
import { EVERSTAKE_POOLS, FIVE_BINARIES_POOLS } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

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

const DREP_HASH = '429b12461640cefd3a4a192f7c531d8f6c6d33610b727f481eb22d39';
const DREP_CIP105_KEY_HASH = 'drep1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjmv589e';
const DREP_VKH_KEY_HASH = 'drep_vkh1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknjat06vr';
const DREP_CIP105_SCRIPT_HASH = 'drep_script1g2d3y3skgr806wj2ryhhc5ca3akx6vmppde87jq7kgknj5wf0ec';
const DREP_CIP129_KEY_HASH = 'drep1yfpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsqdglp';
const DREP_CIP129_SCRIPT_HASH = 'drep1ydpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsjaelx';

const DREP_CC_HOT_HEADER = 'drep1qfpfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgzsugcp';
const DREP_RESERVED_HEADER = 'drep1y9pfkyjxzeqvalf6fgvj7lznrk8kcmfnvy9hyl6gr6ez6wgsl5jlg';

const EVERSTAKE_DREP_CIP105 = 'drep1ectemlv45xsnvenfgkhwsxncfvxev4qllj7x5w6vlfc7kmd9zcs';

const PREDEFINED_DREP_ID = 'drep_always_abstain';

const drepHashBytes = Buffer.from(DREP_HASH, 'hex');
const encodeDrepId = (prefix: string, payload: Uint8Array) =>
    bech32.encode(prefix, bech32.toWords(payload));

const DREP_SCRIPT_WITH_CIP129_PAYLOAD = encodeDrepId(
    'drep_script',
    Uint8Array.from([0x23, ...drepHashBytes]),
);
const DREP_VKH_WITH_CIP129_PAYLOAD = encodeDrepId(
    'drep_vkh',
    Uint8Array.from([0x22, ...drepHashBytes]),
);
const DREP_TRUNCATED_HASH = encodeDrepId('drep', drepHashBytes.subarray(1));
const POOL_ID = encodeDrepId('pool', drepHashBytes);

const DREP_BROKEN_CHECKSUM = DREP_CIP129_KEY_HASH.replace(/.$/, character =>
    character === 'q' ? 'p' : 'q',
);
const DREP_UPPERCASE = DREP_CIP129_KEY_HASH.toUpperCase();
const DREP_MIXED_CASE = `${DREP_CIP129_KEY_HASH.slice(0, 10).toUpperCase()}${DREP_CIP129_KEY_HASH.slice(10)}`;

export const validateCardanoDrep = [
    { description: 'CIP-129 key hash', drepId: DREP_CIP129_KEY_HASH, result: true },
    { description: 'CIP-129 script hash', drepId: DREP_CIP129_SCRIPT_HASH, result: true },
    { description: 'legacy CIP-105 key hash', drepId: DREP_CIP105_KEY_HASH, result: true },
    { description: 'amended CIP-105 key hash', drepId: DREP_VKH_KEY_HASH, result: true },
    { description: 'CIP-105 script hash', drepId: DREP_CIP105_SCRIPT_HASH, result: true },
    { description: 'the Everstake DRep', drepId: CARDANO_EVERSTAKE_DREP.bech32, result: true },
    { description: 'an all-uppercase id', drepId: DREP_UPPERCASE, result: true },
    {
        description: 'CIP-129 payload headed by a CC hot credential',
        drepId: DREP_CC_HOT_HEADER,
        result: false,
    },
    {
        description: 'CIP-129 payload with an undefined credential type',
        drepId: DREP_RESERVED_HEADER,
        result: false,
    },
    {
        description: 'CIP-129 payload spelled `drep_script`',
        drepId: DREP_SCRIPT_WITH_CIP129_PAYLOAD,
        result: false,
    },
    {
        description: 'CIP-129 payload spelled `drep_vkh`',
        drepId: DREP_VKH_WITH_CIP129_PAYLOAD,
        result: false,
    },
    { description: 'a hash one byte short', drepId: DREP_TRUNCATED_HASH, result: false },
    { description: 'a pool id', drepId: POOL_ID, result: false },
    { description: 'a broken checksum', drepId: DREP_BROKEN_CHECKSUM, result: false },
    { description: 'a mixed-case id', drepId: DREP_MIXED_CASE, result: false },
    { description: 'the always-abstain id', drepId: PREDEFINED_DREP_ID, result: false },
    { description: 'the no-confidence id', drepId: 'drep_always_no_confidence', result: false },
    { description: 'an empty string', drepId: '', result: false },
    { description: 'arbitrary text', drepId: 'not-a-drep', result: false },
    { description: 'a bare hex hash', drepId: CARDANO_EVERSTAKE_DREP.hex, result: false },
];

const keyHashCredential = { type: PROTO.CardanoDRepType.KEY_HASH, hex: DREP_HASH };
const scriptHashCredential = { type: PROTO.CardanoDRepType.SCRIPT_HASH, hex: DREP_HASH };

export const decodeCardanoDrepId = [
    {
        description: 'legacy CIP-105 key hash',
        drepId: DREP_CIP105_KEY_HASH,
        result: keyHashCredential,
    },
    {
        description: 'amended CIP-105 key hash',
        drepId: DREP_VKH_KEY_HASH,
        result: keyHashCredential,
    },
    { description: 'CIP-129 key hash', drepId: DREP_CIP129_KEY_HASH, result: keyHashCredential },
    {
        description: 'CIP-105 script hash',
        drepId: DREP_CIP105_SCRIPT_HASH,
        result: scriptHashCredential,
    },
    {
        description: 'CIP-129 script hash',
        drepId: DREP_CIP129_SCRIPT_HASH,
        result: scriptHashCredential,
    },
    {
        description: 'the Everstake DRep, pinned to the hash the device is sent',
        drepId: CARDANO_EVERSTAKE_DREP.bech32,
        result: { type: PROTO.CardanoDRepType.KEY_HASH, hex: CARDANO_EVERSTAKE_DREP.hex },
    },
    { description: 'an unsupported header byte', drepId: DREP_CC_HOT_HEADER, result: null },
    { description: 'the always-abstain id', drepId: PREDEFINED_DREP_ID, result: null },
    { description: 'an empty string', drepId: '', result: null },
];

export const normalizeCardanoDrepId = [
    {
        description: 'legacy CIP-105 key hash',
        drepId: DREP_CIP105_KEY_HASH,
        result: DREP_CIP129_KEY_HASH,
    },
    {
        description: 'amended CIP-105 key hash',
        drepId: DREP_VKH_KEY_HASH,
        result: DREP_CIP129_KEY_HASH,
    },
    {
        description: 'CIP-105 script hash',
        drepId: DREP_CIP105_SCRIPT_HASH,
        result: DREP_CIP129_SCRIPT_HASH,
    },
    {
        description: 'a canonical key hash is returned unchanged',
        drepId: DREP_CIP129_KEY_HASH,
        result: DREP_CIP129_KEY_HASH,
    },
    {
        description: 'a canonical script hash is returned unchanged',
        drepId: DREP_CIP129_SCRIPT_HASH,
        result: DREP_CIP129_SCRIPT_HASH,
    },
    {
        description: 'an all-uppercase id is lowercased',
        drepId: DREP_UPPERCASE,
        result: DREP_CIP129_KEY_HASH,
    },
    {
        description: 'the Everstake DRep in the legacy spelling',
        drepId: EVERSTAKE_DREP_CIP105,
        result: CARDANO_EVERSTAKE_DREP.bech32,
    },
    {
        description: 'the Everstake DRep constant',
        drepId: CARDANO_EVERSTAKE_DREP.bech32,
        result: CARDANO_EVERSTAKE_DREP.bech32,
    },
    { description: 'an unsupported header byte', drepId: DREP_CC_HOT_HEADER, result: null },
    { description: 'the always-abstain id', drepId: PREDEFINED_DREP_ID, result: null },
    { description: 'an empty string', drepId: '', result: null },
    { description: 'arbitrary text', drepId: 'not-a-drep', result: null },
];

export const areCardanoDrepIdsEqual = [
    {
        description: 'legacy and canonical key hash',
        drepIdA: DREP_CIP105_KEY_HASH,
        drepIdB: DREP_CIP129_KEY_HASH,
        result: true,
    },
    {
        description: 'amended CIP-105 and canonical key hash',
        drepIdA: DREP_VKH_KEY_HASH,
        drepIdB: DREP_CIP129_KEY_HASH,
        result: true,
    },
    {
        description: 'CIP-105 and canonical script hash',
        drepIdA: DREP_CIP105_SCRIPT_HASH,
        drepIdB: DREP_CIP129_SCRIPT_HASH,
        result: true,
    },
    {
        description: 'the Everstake DRep in both spellings',
        drepIdA: EVERSTAKE_DREP_CIP105,
        drepIdB: CARDANO_EVERSTAKE_DREP.bech32,
        result: true,
    },
    {
        description: 'the always-abstain id against itself',
        drepIdA: PREDEFINED_DREP_ID,
        drepIdB: PREDEFINED_DREP_ID,
        result: true,
    },
    {
        description: 'a script hash and a key hash sharing one hash',
        drepIdA: DREP_CIP105_SCRIPT_HASH,
        drepIdB: DREP_CIP105_KEY_HASH,
        result: false,
    },
    {
        description: 'both canonical spellings of one hash',
        drepIdA: DREP_CIP129_SCRIPT_HASH,
        drepIdB: DREP_CIP129_KEY_HASH,
        result: false,
    },
    {
        description: 'two different DReps',
        drepIdA: DREP_CIP129_KEY_HASH,
        drepIdB: CARDANO_EVERSTAKE_DREP.bech32,
        result: false,
    },
    {
        description: 'the two predefined ids',
        drepIdA: PREDEFINED_DREP_ID,
        drepIdB: 'drep_always_no_confidence',
        result: false,
    },
    {
        description: 'the always-abstain id against a real DRep',
        drepIdA: PREDEFINED_DREP_ID,
        drepIdB: DREP_CIP129_KEY_HASH,
        result: false,
    },
    { description: 'two accounts with no delegation', drepIdA: null, drepIdB: null, result: false },
    { description: 'two empty strings', drepIdA: '', drepIdB: '', result: false },
    {
        description: 'a DRep against no delegation',
        drepIdA: DREP_CIP129_KEY_HASH,
        drepIdB: undefined,
        result: false,
    },
];

const cardanoAccountWithDrep = (
    drep: { drep_id: string; hex?: string } | null,
    isActive = true,
) => ({
    networkType: 'cardano',
    misc: { staking: { poolId: everstakePool, drep, isActive } },
});

export const getCardanoAccountDrepId = [
    {
        description: 'legacy drep_id with the canonical payload in hex',
        account: cardanoAccountWithDrep({
            drep_id: EVERSTAKE_DREP_CIP105,
            hex: `22${CARDANO_EVERSTAKE_DREP.hex}`,
        }),
        result: CARDANO_EVERSTAKE_DREP.bech32,
    },
    {
        description: 'hex says script hash where the drep_id spelling cannot',
        account: cardanoAccountWithDrep({
            drep_id: DREP_CIP105_KEY_HASH,
            hex: `23${DREP_HASH}`,
        }),
        result: DREP_CIP129_SCRIPT_HASH,
    },
    {
        description: 'empty hex falls back to converting drep_id',
        account: cardanoAccountWithDrep({ drep_id: EVERSTAKE_DREP_CIP105, hex: '' }),
        result: CARDANO_EVERSTAKE_DREP.bech32,
    },
    {
        description: 'missing hex falls back to converting a script drep_id',
        account: cardanoAccountWithDrep({ drep_id: DREP_CIP105_SCRIPT_HASH }),
        result: DREP_CIP129_SCRIPT_HASH,
    },
    {
        description: 'unusable hex falls back to converting drep_id',
        account: cardanoAccountWithDrep({ drep_id: DREP_CIP105_KEY_HASH, hex: 'zz' }),
        result: DREP_CIP129_KEY_HASH,
    },
    {
        description: 'an already canonical drep_id',
        account: cardanoAccountWithDrep({ drep_id: DREP_CIP129_SCRIPT_HASH }),
        result: DREP_CIP129_SCRIPT_HASH,
    },
    {
        description: 'a predefined drep_id passes through unchanged',
        account: cardanoAccountWithDrep({ drep_id: PREDEFINED_DREP_ID, hex: '' }),
        result: PREDEFINED_DREP_ID,
    },
    {
        description: 'account without delegation',
        account: cardanoAccountWithDrep(null),
        result: null,
    },
    {
        description: 'account whose backend drep_id is empty',
        account: cardanoAccountWithDrep({ drep_id: '' }),
        result: null,
    },
    {
        description: 'non-cardano account',
        account: { networkType: 'ethereum' },
        result: null,
    },
];

export const hasCardanoLiveVoteDelegation = [
    {
        description: 'registered account voting for a DRep',
        account: cardanoAccountWithDrep({ drep_id: CARDANO_EVERSTAKE_DREP.bech32 }),
        result: true,
    },
    {
        description: 'registered account voting for a DRep reported in the legacy spelling',
        account: cardanoAccountWithDrep({ drep_id: EVERSTAKE_DREP_CIP105 }),
        result: true,
    },
    {
        description: 'registered account voting to always abstain',
        account: cardanoAccountWithDrep({ drep_id: PREDEFINED_DREP_ID, hex: '' }),
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
