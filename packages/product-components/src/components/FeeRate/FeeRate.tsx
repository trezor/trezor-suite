import { NetworkSymbol, NetworkType, hasNetworkSettlementLayer } from '@suite-common/wallet-config';
import { getFeeUnits } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

type FeeRateProps = {
    feeRate?: string | BigNumber;
    networkType: NetworkType;
    symbol: NetworkSymbol;
};

export const FeeRate = ({ feeRate, networkType, symbol }: FeeRateProps) => {
    if (!feeRate) return null;

    const fee = (() => {
        switch (networkType) {
            case 'ethereum': {
                const decimals = hasNetworkSettlementLayer(symbol) ? 4 : 2;
                const multiplier = Math.pow(10, decimals);
                const value = Math.ceil(Number(feeRate) * multiplier) / multiplier;

                return value.toFixed(decimals);
            }
            case 'bitcoin': {
                const feeBn = typeof feeRate === 'string' ? new BigNumber(feeRate) : feeRate;

                return feeBn.toFixed(2);
            }
            default:
                return typeof feeRate === 'string' ? feeRate : feeRate.toString();
        }
    })();

    return (
        <span>
            {fee}&nbsp;{getFeeUnits(networkType)}
        </span>
    );
};
