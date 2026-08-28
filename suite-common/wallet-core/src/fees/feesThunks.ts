import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { isNotUndefined, resolveAfter, typedObjectFromEntries } from '@trezor/utils';

import { FEES_MODULE_PREFIX, feesActions } from './feesActions';
import { DEFAULT_FEE_INFO } from './feesConstants';
import { type FeesRootState, selectRawNetworkFeeInfo } from './feesSelectors';
import { getNewFeeInfo, sortLevels } from './feesUtils';
import {
    type BlockchainRootState,
    selectNetworkBlockchainInfo,
} from '../blockchain/blockchainReducer';
import {
    type WalletSettingsRootState,
    selectEnabledNetworks,
} from '../settings/walletSettingsReducer';
type PreloadFeeInfoThunkState = WalletSettingsRootState;

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

export const preloadFeeInfoThunk = createThunk<void, void, { state: PreloadFeeInfoThunkState }>(
    `${FEES_MODULE_PREFIX}/preloadFeeInfoThunk`,
    async (_, { dispatch, getState }) => {
        const enabledNetworks = selectEnabledNetworks(getState());

        // Fetch default fee levels
        const networks = networksCollection.filter(
            n => !n.isHidden && enabledNetworks?.includes(n.symbol),
        );

        const levels = await Promise.all(
            networks.map(async network => {
                const result = await TrezorConnect.blockchainEstimateFee({
                    coin: asCoinSymbol(network.symbol),
                    request: { feeLevels: 'preloaded' },
                });

                return result.success ? ([network, result] as const) : undefined;
            }),
        );

        const partial = typedObjectFromEntries(
            levels.filter(isNotUndefined).map(([network, result]) => {
                const { payload } = result;
                const feeInfo: FeeInfo = {
                    blockHeight: 0,
                    ...payload,
                    levels: payload.levels
                        // hack to hide "low" fee option
                        // (we do not want to change the connect API as it is a potentially breaking change)
                        .filter(level => level.label !== 'low')
                        .sort(sortLevels)
                        .map(level => ({
                            ...level,
                            label: level.label || 'normal',
                        })),
                };

                return [network.symbol, { status: 'preloaded' as const, data: feeInfo }];
            }),
        );

        dispatch(feesActions.updateMultipleFees(partial));
    },
);

type UpdateFeeInfoThunkProps = {
    networkSymbol: NetworkSymbol;
    artificialDelay?: number;
};
export type UpdateFeeInfoThunkState = BlockchainRootState & DeviceRootState & FeesRootState;

/**
 * Fetches feeInfo for a given network from backend.
 * Can be called with an arbitrary delay [ms], in order to display loader for a bit longer,
 * to visually draw users attention to the fees which are changing (because backend request is usually very quick).
 */
export const updateFeeInfoThunk = createThunk<
    FeeInfo,
    UpdateFeeInfoThunkProps,
    {
        rejectValue: undefined;
        state: UpdateFeeInfoThunkState;
    }
>(
    `${FEES_MODULE_PREFIX}/updateFeeInfoThunk`,
    async ({ networkSymbol, artificialDelay }, { getState, fulfillWithValue, rejectWithValue }) => {
        const network = getNetwork(networkSymbol);
        const { symbol } = network;
        const blockchainInfo = selectNetworkBlockchainInfo(getState(), symbol);

        // Tron fees are derived per transaction from bandwidth/energy, there is no
        // network-level fee estimate to fetch. Keep the current (preloaded) data.
        if (network.networkType === 'tron') {
            const currentFeeInfo = selectRawNetworkFeeInfo(getState(), symbol);

            return fulfillWithValue(
                currentFeeInfo ?? { ...DEFAULT_FEE_INFO, blockHeight: blockchainInfo.blockHeight },
            );
        }

        const device = selectSelectedDevice(getState());

        const [newFeeInfo] = await Promise.all([
            getNewFeeInfo({ network, device }),
            resolveAfter(artificialDelay ?? 0),
        ]);

        if (newFeeInfo === undefined) {
            // now errors just silently set status. If we want to handle them in any way, we might need more specific info
            return rejectWithValue(undefined);
        }
        const data = { blockHeight: blockchainInfo.blockHeight, ...newFeeInfo };

        return fulfillWithValue(data);
    },
);

interface GetOrFetchRawFeeInfoThunkProps {
    networkSymbol: NetworkSymbol;
}
export type GetOrFetchRawFeeInfoThunkState = UpdateFeeInfoThunkState;

export const getOrFetchRawFeeInfoThunk = createThunk<
    FeeInfo | undefined,
    GetOrFetchRawFeeInfoThunkProps,
    { state: GetOrFetchRawFeeInfoThunkState }
>(
    `${FEES_MODULE_PREFIX}/getOrFetchRawFeeInfoThunk`,
    async ({ networkSymbol }, { dispatch, getState }) => {
        const rawFeeInfo = selectRawNetworkFeeInfo(getState(), networkSymbol);

        if (rawFeeInfo) {
            return rawFeeInfo;
        }

        await dispatch(updateFeeInfoThunk({ networkSymbol }));

        return selectRawNetworkFeeInfo(getState(), networkSymbol);
    },
);
