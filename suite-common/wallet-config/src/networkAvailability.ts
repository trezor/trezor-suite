import { type Network } from './types';

// Whether a network ships on the current build. Networks that rely on desktop-only infrastructure
// (e.g. Monero's locally-managed node) are marked `isDesktopOnlyNetwork` and are only available on
// the desktop build. The decision to honour that flag is injected by each platform's composition
// root instead of being branched on with `isDesktop()` throughout the UI.
export type IsNetworkAvailableOnBuild = (network: Network) => boolean;

export type NetworkAvailability = {
    isNetworkAvailableOnBuild: IsNetworkAvailableOnBuild;
};

// Consumed via dependency injection: `{ networkAvailability }` lives on the services bag.
export type NetworkAvailabilityDep = {
    networkAvailability: NetworkAvailability;
};

// The desktop composition root builds this with `allowDesktopOnlyNetworks: true` (the single place a
// Monero-permitting value is created); web/native build it with `false`.
export const createNetworkAvailability = ({
    allowDesktopOnlyNetworks,
}: {
    allowDesktopOnlyNetworks: boolean;
}): NetworkAvailability => ({
    isNetworkAvailableOnBuild: network => allowDesktopOnlyNetworks || !network.isDesktopOnlyNetwork,
});

// Selector for `useServices` (the services bag is untyped, matching the other service selectors).
export const selectNetworkAvailabilityDep = (services: any): NetworkAvailabilityDep => ({
    networkAvailability: services.networkAvailability,
});
