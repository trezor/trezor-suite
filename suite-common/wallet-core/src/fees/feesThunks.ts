import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, getNetworkOptional, networksCollection } from '@suite-common/wallet-config';
import { FeeInfo, FeesState } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { FEES_MODULE_PREFIX, feesActions } from './feesActions';
import { getNewFeeInfo, sortLevels } from './feesUtils';
import { selectNetworkBlockchainInfo } from '../blockchain/blockchainReducer';
import { selectSelectedDevice } from '../device/deviceSelectors';
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
                    levels: sortLevels(
                        payload.levels
                            // hack to hide "low" fee option
                            // (we do not want to change the connect API as it is a potentially breaking change)
                            .filter(level => level.label !== 'low'),
                    ).map(level => ({
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
};

export const updateFeeInfoThunk = createThunk(
    `${FEES_MODULE_PREFIX}/updateFeeInfoThunk`,
    async ({ networkSymbol }: UpdateFeeInfoThunkProps, { dispatch, getState }) => {
        const network = getNetworkOptional(networkSymbol.toLowerCase());
        if (!network) return;
        const { symbol } = network;
        const blockchainInfo = selectNetworkBlockchainInfo(getState(), symbol);
        const device = selectSelectedDevice(getState());

        dispatch(feesActions.updateFee({ symbol, status: 'loading' }));

        const newFeeInfo = await getNewFeeInfo({ network, device });

        if (newFeeInfo === undefined) {
            return dispatch(feesActions.updateFee({ symbol, status: 'error' }));
        }
        const backfilledNewFeeInfo = { blockHeight: blockchainInfo.blockHeight, ...newFeeInfo };

        dispatch(
            feesActions.updateFee({
                symbol,
                status: 'loaded',
                data: backfilledNewFeeInfo,
            }),
        );
    },
);
