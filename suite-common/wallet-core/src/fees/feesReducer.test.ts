import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, type FeesState } from '@suite-common/wallet-types';

import { selectConvertedNetworkFeeInfo } from './feesReducer';
import { type FeesRootState } from './feesSelectors';

const ethSymbol = asNetworkSymbol('eth');
const btcSymbol = asNetworkSymbol('btc');

const ethFeeInfo: FeeInfo = {
    blockHeight: 200,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [{ label: 'normal', feePerUnit: '3000000000', blocks: 2 }],
};

const btcFeeInfo: FeeInfo = {
    blockHeight: 800000,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '10', blocks: 3 }],
};

const buildState = (fees: FeesState): FeesRootState => ({ wallet: { fees } });

describe('selectConvertedNetworkFeeInfo', () => {
    it('returns null when the network has no fee entry', () => {
        const state = buildState({ [btcSymbol]: { status: 'loaded', data: btcFeeInfo } });

        expect(selectConvertedNetworkFeeInfo(state, ethSymbol)).toBeNull();
        expect(selectConvertedNetworkFeeInfo(state, undefined)).toBeNull();
    });

    it('returns converted fee info when the network entry exists without data yet', () => {
        const state = buildState({ [ethSymbol]: { status: 'loading' } });

        expect(selectConvertedNetworkFeeInfo(state, ethSymbol)).not.toBeNull();
    });

    it('keeps the returned reference stable when another network fees change', () => {
        const ethEntry = { status: 'loaded', data: ethFeeInfo } as const;
        const stateBefore = buildState({ [ethSymbol]: ethEntry });
        const stateAfter = buildState({
            [ethSymbol]: ethEntry,
            [btcSymbol]: { status: 'loaded', data: btcFeeInfo },
        });

        expect(selectConvertedNetworkFeeInfo(stateAfter, ethSymbol)).toBe(
            selectConvertedNetworkFeeInfo(stateBefore, ethSymbol),
        );
    });

    it('keeps the returned reference stable when only the network status changes', () => {
        const stateBefore = buildState({ [ethSymbol]: { status: 'loaded', data: ethFeeInfo } });
        const stateAfter = buildState({ [ethSymbol]: { status: 'loading', data: ethFeeInfo } });

        expect(selectConvertedNetworkFeeInfo(stateAfter, ethSymbol)).toBe(
            selectConvertedNetworkFeeInfo(stateBefore, ethSymbol),
        );
    });

    it('returns new converted fee info when the network fee data change', () => {
        const stateBefore = buildState({ [ethSymbol]: { status: 'loaded', data: ethFeeInfo } });
        const stateAfter = buildState({
            [ethSymbol]: { status: 'loaded', data: { ...ethFeeInfo, blockHeight: 201 } },
        });

        const feeInfoBefore = selectConvertedNetworkFeeInfo(stateBefore, ethSymbol);
        const feeInfoAfter = selectConvertedNetworkFeeInfo(stateAfter, ethSymbol);

        expect(feeInfoAfter).not.toBe(feeInfoBefore);
        expect(feeInfoAfter?.blockHeight).toBe(201);
    });
});
