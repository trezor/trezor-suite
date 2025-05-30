import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, getNetworkOptional, networksCollection } from '@suite-common/wallet-config';
import type { NetworksFees } from '@suite-common/wallet-types';
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

        const partial: Partial<NetworksFees> = {};
        networks.forEach((network, index) => {
            const result = levels[index];

            if (result.success) {
                const { payload } = result;
                partial[network.symbol] = {
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
            }
        });

        dispatch(feesActions.updateFee(partial));
    },
);

export const updateFeeInfoThunk = createThunk(
    `${FEES_MODULE_PREFIX}/updateFeeInfoThunk`,
    async ({ networkSymbol }: { networkSymbol: NetworkSymbol }, { dispatch, getState }) => {
        const network = getNetworkOptional(networkSymbol.toLowerCase());
        if (!network) return;
        const blockchainInfo = selectNetworkBlockchainInfo(getState(), network.symbol);
        const device = selectSelectedDevice(getState());

        const newFeeInfo = await getNewFeeInfo({ network, device });
        if (newFeeInfo === undefined) return;

        const partialFees: Partial<NetworksFees> = {};
        partialFees[network.symbol] = {
            blockHeight: blockchainInfo.blockHeight,
            ...newFeeInfo,
        };
        dispatch(feesActions.updateFee(partialFees));
    },
);
