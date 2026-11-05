import type { TrxStats } from '@suite-common/earn-staking-api';
import {
    MOCK_TRON_EXTERNAL_SR,
    MOCK_TRON_LUGANODES_SR,
    MOCK_TRON_P2P_ORG_SR,
} from '@suite-common/wallet-types/mocks';
import { createMockDeps } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    type TronCuratedProductInfoDeps,
    fetchTronCuratedProductInfo,
} from './tronCuratedProductInfo';
import { getTronRepresentatives } from './tronRepresentatives';
import { luganodesProvider } from '../../providers/luganodes';
import { p2pProvider } from '../../providers/p2p';

const representatives = getTronRepresentatives({
    networkSymbol: asNetworkSymbol('trx'),
    providers: [luganodesProvider, p2pProvider],
});

const trxStats: TrxStats = [
    { address: MOCK_TRON_P2P_ORG_SR, name: 'P2P.ORG', url: 'https://www.p2p.org', apr: 3.266833 },
    {
        address: MOCK_TRON_LUGANODES_SR,
        name: 'Luganodes',
        url: 'https://luganodes.com',
        apr: 3.252901,
    },
];

const createDeps = (stats: TrxStats = trxStats) =>
    createMockDeps<TronCuratedProductInfoDeps>({
        getTronStakingStats: () => Promise.resolve(stats),
    });

describe('fetchTronCuratedProductInfo', () => {
    it('lists the offered representatives and promotes the highest APR', async () => {
        await expect(
            fetchTronCuratedProductInfo(createDeps(), { representatives }),
        ).resolves.toEqual({
            rate: 3.266833,
            entryPeriodDays: null,
            exitPeriodDays: 14,
            nextRewardAt: null,
            targets: [
                {
                    address: MOCK_TRON_P2P_ORG_SR,
                    providerId: 'p2p.org',
                    name: 'P2P.org',
                    rate: 3.266833,
                    saturation: null,
                },
                {
                    address: MOCK_TRON_LUGANODES_SR,
                    providerId: 'luganodes',
                    name: 'Luganodes',
                    rate: 3.252901,
                    saturation: null,
                },
            ],
        });
    });

    it('names a target after its provider, not after the stats', async () => {
        const info = await fetchTronCuratedProductInfo(
            createDeps(trxStats.map(sr => ({ ...sr, name: 'Official Trezor SR' }))),
            { representatives },
        );

        expect(info.targets.map(({ name }) => name)).toEqual(['P2P.org', 'Luganodes']);
    });

    it('leaves out a representative no provider offers', async () => {
        const info = await fetchTronCuratedProductInfo(
            createDeps([
                ...trxStats,
                {
                    address: MOCK_TRON_EXTERNAL_SR,
                    name: 'Other',
                    url: 'https://example.com',
                    apr: 9,
                },
            ]),
            { representatives },
        );

        expect(info.rate).toBe(3.266833);
        expect(info.targets.map(({ address }) => address)).toEqual([
            MOCK_TRON_P2P_ORG_SR,
            MOCK_TRON_LUGANODES_SR,
        ]);
    });

    it('keeps the first entry of a representative the stats repeat', async () => {
        const info = await fetchTronCuratedProductInfo(
            createDeps([...trxStats, { ...trxStats[1]!, apr: 9 }]),
            { representatives },
        );

        expect(info.rate).toBe(3.266833);
        expect(info.targets.map(({ address, rate }) => ({ address, rate }))).toEqual([
            { address: MOCK_TRON_P2P_ORG_SR, rate: 3.266833 },
            { address: MOCK_TRON_LUGANODES_SR, rate: 3.252901 },
        ]);
    });

    it('has no rate without an offered representative', async () => {
        await expect(
            fetchTronCuratedProductInfo(createDeps([]), { representatives }),
        ).resolves.toMatchObject({ rate: null, targets: [] });
    });

    it('requests the stats with the abort signal', async () => {
        const deps = createDeps();
        const abortSignal = new AbortController().signal;

        await fetchTronCuratedProductInfo(deps, { abortSignal, representatives });

        expect(deps.getTronStakingStats).toHaveBeenCalledWith({ signal: abortSignal });
    });

    it('rejects when the stats request fails', async () => {
        const deps = createMockDeps<TronCuratedProductInfoDeps>({
            getTronStakingStats: () => Promise.reject(new Error('Request failed')),
        });

        await expect(fetchTronCuratedProductInfo(deps, { representatives })).rejects.toThrow(
            'Request failed',
        );
    });
});
