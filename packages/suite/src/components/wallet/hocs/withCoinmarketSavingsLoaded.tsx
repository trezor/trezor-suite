import {
    withCoinmarketAuthentication,
    WithCoinmarketAuthenticationOptions,
} from './withCoinmarketAuthentication';
import { withCoinmarketLoaded, WithCoinmarketLoadedProps } from './withCoinmarketLoaded';

type WithCoinmarketSavingsLoadedOptions = WithCoinmarketAuthenticationOptions;

export const withCoinmarketSavingsLoaded = (
    WrappedComponent: React.ComponentType<WithCoinmarketLoadedProps>,
    options: WithCoinmarketSavingsLoadedOptions = { checkInvityAuthenticationImmediately: true },
) =>
    withCoinmarketAuthentication(withCoinmarketLoaded(WrappedComponent, 'TR_NAV_SAVINGS'), options);
