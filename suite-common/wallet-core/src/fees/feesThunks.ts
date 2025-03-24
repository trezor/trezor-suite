import { createThunk } from '@suite-common/redux-utils';
import {
    NetworkSymbol,
    getNetwork,
    getNetworkOptional,
    networksCollection,
} from '@suite-common/wallet-config';
import type { NetworksFees } from '@suite-common/wallet-types';
import { isEip1559 } from '@suite-common/wallet-utils';
import TrezorConnect, { FeeLevel } from '@trezor/connect';

import { FEES_MODULE_PREFIX, feesActions } from './feesActions';
import { selectNetworkBlockchainInfo } from '../blockchain/blockchainReducer';
import { selectFees, selectNetworkFeeInfo } from '../fees/feesReducer';

// Conditionally subscribe to blockchain backend
// called after TrezorConnect.init successfully emits TRANSPORT.START event
// checks if there are discovery processes loaded from LocalStorage
// if so starts subscription to proper networks

// sort FeeLevels in reversed order (Low > High)
// TODO: consider to use same order in @trezor/connect to avoid double sorting
const order: FeeLevel['label'][] = ['low', 'economy', 'normal', 'high'];
const sortLevels = (levels: FeeLevel[]) =>
    levels.sort((levelA, levelB) => order.indexOf(levelA.label) - order.indexOf(levelB.label));

export const preloadFeeInfoThunk = createThunk(
    `${FEES_MODULE_PREFIX}/preloadFeeInfoThunk`,
    async (_, { dispatch, getState, extra }) => {
        const {
            selectors: { selectEnabledNetworks },
        } = extra;
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
    async (
        { networkSymbol, forceUpdate }: { networkSymbol: string; forceUpdate?: boolean },
        { dispatch, getState, extra },
    ) => {
        const network = getNetworkOptional(networkSymbol.toLowerCase());
        if (!network) return;
        const blockchainInfo = selectNetworkBlockchainInfo(getState(), network.symbol);
        const feeInfo = selectNetworkFeeInfo(getState(), network.symbol);
        const device = extra.selectors.selectDevice(getState());
        // TODO: remove when EIP-1559 complete
        const isDebugModeActive = extra.selectors.selectDebugSettings(getState()).showDebugMenu;

        if (
            feeInfo &&
            feeInfo.blockHeight > 0 &&
            blockchainInfo.blockHeight - feeInfo.blockHeight < 10 &&
            !forceUpdate
        ) {
            return;
        }

        let newFeeInfo;

        if (network.networkType === 'ethereum') {
            const result = await TrezorConnect.blockchainEstimateFee({
                coin: network.symbol,
                request: {
                    blocks: [2],
                    feeLevels: 'smart',
                    specific: {
                        from: '0x0000000000000000000000000000000000000000',
                        to: '0x0000000000000000000000000000000000000000',
                    },
                },
            });
            if (result.success) {
                const feeLevelBase = result.payload.levels[0];
                const isEip1559ActivatedAndAvailable =
                    getNetwork(network.symbol).features.includes('eip1559') &&
                    isEip1559(feeLevelBase) &&
                    isDebugModeActive &&
                    !device?.unavailableCapabilities?.['eip1559'];

                if (isEip1559ActivatedAndAvailable) {
                    newFeeInfo = result.payload;
                } else {
                    newFeeInfo = {
                        ...result.payload,
                        levels: [
                            {
                                ...feeLevelBase,
                                baseFeePerGas: undefined,
                                maxFeePerGas: undefined,
                                maxPriorityFeePerGas: undefined,
                                maxWaitTimeEstimate: undefined,
                                label: 'normal' as const,
                            },
                        ],
                    };
                }
            }
        } else {
            const result = await TrezorConnect.blockchainEstimateFee({
                coin: network.symbol,
                request: {
                    feeLevels: 'smart',
                },
            });
            if (result.success) {
                newFeeInfo = {
                    ...result.payload,
                    levels: sortLevels(
                        result.payload.levels
                            // hack to hide "low" fee option
                            // (we do not want to change the connect API as it is a potentially breaking change)
                            .filter(level => level.label !== 'low'),
                    ),
                };
            }
        }

        if (newFeeInfo) {
            const partial: Partial<NetworksFees> = {};
            partial[network.symbol] = {
                blockHeight: blockchainInfo.blockHeight,
                ...newFeeInfo,
            };

            dispatch(feesActions.updateFee(partial));
        }
    },
);

export const removeFeeInfoThunk = createThunk(
    `${FEES_MODULE_PREFIX}/removeFeeInfoThunk`,
    ({ networks }: { networks: NetworkSymbol[] }, { dispatch, getState }) => {
        const fees = selectFees(getState());
        const networksWithFees = Object.keys(fees) as NetworkSymbol[];

        const removedNetworks = networksWithFees.filter(
            network => !networks.includes(network as NetworkSymbol),
        );

        removedNetworks.forEach(network => {
            dispatch(feesActions.removeFee({ network }));
        });
    },
);
