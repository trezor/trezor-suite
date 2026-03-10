import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, getNetwork, networksCollection } from '@suite-common/wallet-config';
import { FeeInfo, FeesState } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { FEES_MODULE_PREFIX, feesActions } from './feesActions';
import { getNewFeeInfo, sortLevels } from './feesUtils';
import { selectNetworkBlockchainInfo } from '../blockchain/blockchainReducer';
import { selectEnabledNetworks } from '../settings/walletSettingsReducer';

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

export const preloadFeeInfoThunk = createThunk(
    `${FEES_MODULE_PREFIX}/preloadFeeInfoThunk`,
    async (_, { dispatch, getState }) => {
        const enabledNetworks = selectEnabledNetworks(getState());

        // Fetch default fee levels
        const networks = networksCollection.filter(
            n => !n.isHidden && enabledNetworks?.includes(n.symbol),
        );
        const promises = networks.map(network =>
            TrezorConnect.blockchainEstimateFee({
                coin: network.symbol,
                request: {
                    feeLevels: 'preloaded',
                },
            }),
        );
        const levels = await Promise.all(promises);

        const partial: Partial<FeesState> = {};
        networks.forEach((network, index) => {
            const result = levels[index];

            if (result.success) {
                const { payload } = result;
                const feeInfo: FeeInfo = {
                    blockHeight: 0,
                    ...payload,
                    levels: sortLevels(payload.levels).map(level => ({
                        ...level,
                        label: level.label || 'normal',
                    })),
                };
                partial[network.symbol] = {
                    status: 'preloaded',
                    data: feeInfo,
                };
            }
        });

        dispatch(feesActions.updateMultipleFees(partial));
    },
);

type UpdateFeeInfoThunkProps = {
    networkSymbol: NetworkSymbol;
    artificialDelay?: number;
};

const getArtificialDelayPromise = (artificialDelay?: number): Promise<void> =>
    artificialDelay === undefined
        ? Promise.resolve()
        : new Promise(resolve => setTimeout(resolve, artificialDelay));

/**
 * Fetches feeInfo for a given network from backend.
 * Can be called with an arbitrary delay [ms], in order to display loader for a bit longer,
 * to visually draw users attention to the fees which are changing (because backend request is usually very quick).
 */
export const updateFeeInfoThunk = createThunk<
    FeeInfo,
    UpdateFeeInfoThunkProps,
    { rejectValue: undefined }
>(
    `${FEES_MODULE_PREFIX}/updateFeeInfoThunk`,
    async ({ networkSymbol, artificialDelay }, { getState, fulfillWithValue, rejectWithValue }) => {
        const network = getNetwork(networkSymbol);
        const { symbol } = network;
        const blockchainInfo = selectNetworkBlockchainInfo(getState(), symbol);
        const device = selectSelectedDevice(getState());

        const [newFeeInfo] = await Promise.all([
            getNewFeeInfo({ network, device }),
            getArtificialDelayPromise(artificialDelay),
        ]);

        if (newFeeInfo === undefined) {
            // now errors just silently set status. If we want to handle them in any way, we might need more specific info
            return rejectWithValue(undefined);
        }
        const data = { blockHeight: blockchainInfo.blockHeight, ...newFeeInfo };

        return fulfillWithValue(data);
    },
);
