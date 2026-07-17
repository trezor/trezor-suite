import { BigNumber } from '@trezor/utils';

export const getApyPercent = (apyRate: number): number | null => {
    if (!Number.isFinite(apyRate)) {
        return null;
    }

    return new BigNumber(apyRate).times(100).decimalPlaces(2).toNumber();
};

export const isApyAvailable = (apy?: number | null): boolean =>
    apy != null && Number.isFinite(apy) && apy > 0;

// Structural subset of the yield vault reward-rate component (RewardDto from
// @suite-common/earn-stablecoin-defs), so this package does not need to depend on it.
type ApyBreakdownComponent = {
    rate: number;
    token?: { symbol?: string };
};

/**
 * Encodes per-component APY contributions as a single comma-separated string:
 * `SYMBOL_A,APY_A,SYMBOL_B,APY_B,…` sorted alphabetically by symbol. Each
 * component is emitted as-is — symbols repeating across components are not
 * merged. Returns an empty string when there are no usable components.
 */
export const getApyBreakdown = (components: ApyBreakdownComponent[] | undefined): string =>
    (components ?? [])
        .map(component => {
            if (!Number.isFinite(component.rate)) return null;
            const symbol = component.token?.symbol;
            if (!symbol) return null;
            const componentApy = getApyPercent(component.rate);

            return componentApy != null ? ([symbol, componentApy] as const) : null;
        })
        .filter((pair): pair is readonly [string, number] => pair !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([symbol, componentApy]) => [symbol, String(componentApy)])
        .join(',');
