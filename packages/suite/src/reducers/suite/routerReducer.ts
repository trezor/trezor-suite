import { Route } from '@suite-constants/routes';
import { ROUTER } from '@suite-actions/constants';
import { getAppWithParams } from '@suite-utils/router';
import { Action } from '@suite-types';
import { Network } from '@wallet-types';

interface WalletParams {
    symbol: Network['symbol'];
    accountIndex: number;
    accountType: NonNullable<Network['accountType']>;
}

type AppState =
    | {
          app: 'wallet';
          route: Route;
          params: WalletParams | undefined;
      }
    | {
          app: Exclude<Route['app'], 'wallet'>;
          route: Route;
          params: undefined;
      }
    | {
          app: 'unknown';
          route: undefined;
          params: undefined;
      };

type State = {
    url: string;
    pathname: string;
    hash?: string;
} & AppState;

const initialState: State = {
    url: '/',
    pathname: '/',
    app: 'unknown',
    route: undefined,
    params: undefined,
};

const onLocationChange = (url: string) => {
    const [pathname, hash] = url.split('#');
    return {
        url,
        pathname,
        hash,
        ...getAppWithParams(url),
    };
};

export default (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case ROUTER.LOCATION_CHANGE:
            return onLocationChange(action.url);
        default:
            return state;
    }
};
