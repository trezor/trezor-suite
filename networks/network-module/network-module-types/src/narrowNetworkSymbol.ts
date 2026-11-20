import { isArrayMember } from '@trezor/utils';

import type { NetworkSymbol } from './networkSymbol';

export const isSupportedNetworkSymbol = <TNetworkSymbol extends string>(
    supportedNetworks: readonly TNetworkSymbol[],
    networkSymbol: string,
): networkSymbol is TNetworkSymbol =>
    isArrayMember<string, TNetworkSymbol>(networkSymbol, supportedNetworks);

const UnsupportedNetworkSymbolError = (
    networkSymbol: string,
    supportedNetworks: readonly string[],
) =>
    new Error(
        `Unsupported network symbol: ${networkSymbol}. Supported: ${supportedNetworks.join(', ')}.`,
    );

export const narrowNetworkSymbol = <TNetworkSymbol extends string>(
    supportedNetworks: readonly TNetworkSymbol[],
    networkSymbol: NetworkSymbol,
): NetworkSymbol & TNetworkSymbol => {
    if (!isSupportedNetworkSymbol(supportedNetworks, networkSymbol)) {
        throw UnsupportedNetworkSymbolError(networkSymbol, supportedNetworks);
    }

    return networkSymbol;
};

export const createNarrow =
    <TNetworkSymbol extends string>(supportedNetworks: readonly TNetworkSymbol[]) =>
    <TArgs extends unknown[], TResult>(
        fn: (networkSymbol: TNetworkSymbol, ...args: TArgs) => TResult,
    ) =>
    (networkSymbol: NetworkSymbol, ...args: TArgs): TResult =>
        fn(narrowNetworkSymbol(supportedNetworks, networkSymbol), ...args);

export const createNarrowAsync =
    <TNetworkSymbol extends string>(supportedNetworks: readonly TNetworkSymbol[]) =>
    <TArgs extends unknown[], TResult>(
        fn: (networkSymbol: TNetworkSymbol, ...args: TArgs) => Promise<TResult>,
    ) =>
    async (networkSymbol: NetworkSymbol, ...args: TArgs): Promise<TResult> =>
        await fn(narrowNetworkSymbol(supportedNetworks, networkSymbol), ...args);

export const createNarrowComponent =
    <TNetworkSymbol extends string>(supportedNetworks: readonly TNetworkSymbol[]) =>
    <TProps extends { networkSymbol: NetworkSymbol }, TResult>(
        Component: (props: NoInfer<TProps & { networkSymbol: TNetworkSymbol }>) => TResult,
    ) =>
    (props: TProps): TResult =>
        Component({
            ...props,
            networkSymbol: narrowNetworkSymbol(supportedNetworks, props.networkSymbol),
        });
