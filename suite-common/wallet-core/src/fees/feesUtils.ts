import { type TrezorDevice } from '@suite-common/suite-types';
import { type Network, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { isEip1559 } from '@suite-common/wallet-utils';
import TrezorConnect, { type FeeLevel } from '@trezor/connect';
import { type BlockchainEstimatedFeeLevel } from '@trezor/connect-common/src/types/api/blockchainEstimateFee';
import { BigNumber } from '@trezor/utils';

const NETWORK_FEE_OVERRIDES: Record<
    string,
    { minFeePerUnit: Partial<Record<FeeLevel['label'], string>> }
> = {
    bitcoin: {
        minFeePerUnit: {
            normal: '1',
            high: '2',
        },
    },
} as const;

export const ETHEREUM_ADJUST_GAS_LIMIT = '1.25';

// sort FeeLevels in reversed order (Low > High)
// TODO: consider to use same order in @trezor/connect to avoid double sorting
const order: FeeLevel['label'][] = ['low', 'economy', 'normal', 'high'];

export const sortLevels = (levels: FeeLevel[]) =>
    levels.sort((levelA, levelB) => order.indexOf(levelA.label) - order.indexOf(levelB.label));

type GetEip1559AvailabilityProps = {
    symbol: NetworkSymbol;
    feeLevel: FeeLevel;
    device?: TrezorDevice;
};
export const getEip1559Availability = ({ symbol, feeLevel, device }: GetEip1559AvailabilityProps) =>
    getNetwork(symbol).features.includes('eip1559') &&
    isEip1559(feeLevel) &&
    !device?.unavailableCapabilities?.['eip1559'];

type GetNewFeeInfoProps = { network: Network; device?: TrezorDevice };
export const getNewFeeInfo = async ({
    network,
    device,
}: GetNewFeeInfoProps): Promise<BlockchainEstimatedFeeLevel | undefined> => {
    const { symbol } = network;
    if (network.networkType === 'ethereum') {
        const result = await TrezorConnect.blockchainEstimateFee({
            coin: symbol,
            request: {
                blocks: [2],
                feeLevels: 'smart',
                specific: {
                    from: '0x0000000000000000000000000000000000000000',
                    to: '0x0000000000000000000000000000000000000000',
                },
            },
        });
        if (!result.success) return;

        const feeLevelBase = result.payload.levels.at(0);
        // should never occur, all coins have at least one fee level defined
        if (feeLevelBase === undefined) return;
        const isEip1559ActivatedAndAvailable = getEip1559Availability({
            symbol,
            feeLevel: feeLevelBase,
            device,
        });

        if (isEip1559ActivatedAndAvailable) return result.payload;

        return {
            ...result.payload,
            levels: [
                {
                    ...feeLevelBase,
                    baseFeePerGas: undefined,
                    maxFeePerGas: undefined,
                    maxPriorityFeePerGas: undefined,
                    label: 'normal' as const,
                },
            ],
        };
    }

    const result = await TrezorConnect.blockchainEstimateFee({
        coin: symbol,
        request: {
            feeLevels: 'smart',
        },
    });
    if (!result.success) return;

    if (network.symbol === 'btc') {
        const feeOverride = NETWORK_FEE_OVERRIDES.bitcoin;
        result.payload.levels.forEach(level => {
            const minFee = feeOverride.minFeePerUnit[level.label];
            if (minFee !== undefined && new BigNumber(level.feePerUnit).lte(minFee)) {
                level.feePerUnit = minFee;
            }
        });
    }

    return {
        ...result.payload,
        levels: sortLevels(
            result.payload.levels
                // hack to hide "low" fee option
                // (we do not want to change the connect API as it is a potentially breaking change)
                .filter(level => level.label !== 'low'),
        ),
    };
};
