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
    withCoinmarketLoaded(withCoinmarketAuthentication(WrappedComponent, options), 'TR_NAV_SAVINGS');
