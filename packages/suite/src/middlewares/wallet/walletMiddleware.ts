import { MiddlewareAPI } from 'redux';
import TrezorConnect, { UI } from 'trezor-connect';
import { LOCATION_CHANGE } from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import { getApp } from '@suite-utils/router';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import { loadStorage } from '@wallet-actions/storageActions';
import * as walletActions from '@wallet-actions/walletActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import { DISCOVERY_STATUS } from '@wallet-reducers/discoveryReducer';

import { WALLET, DISCOVERY } from '@wallet-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';

// Flow: LOCATION.CHANGE -> WALLET.INIT -> load storage -> WALLET.INIT_SUCCESS
const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const prevState = api.getState();
    // code below runs only in wallet context
    // if (prevState.router.app !== 'wallet') {
    //     return next(action);
    // }

    const prevDiscovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
    const discoveryIsRunning = prevDiscovery && prevDiscovery.status !== DISCOVERY_STATUS.COMPLETED;

    // temporary workaround, needs to be changed in trezor-connect
    // BLOCK action propagation (via next() function) and respond to trezor-connect
    // otherwise devices without backup will receive several "confirmation" modals during discovery process
    if (action.type === UI.REQUEST_CONFIRMATION && discoveryIsRunning) {
        TrezorConnect.uiResponse({
            type: UI.RECEIVE_CONFIRMATION,
            payload: true,
        });
        return action;
    }

    // consider if discovery should be interrupted
    let interruptionIntent = action.type === SUITE.SELECT_DEVICE;
    if (action.type === LOCATION_CHANGE) {
        interruptionIntent = getApp(action.url) !== 'wallet';
    }

    if (interruptionIntent && discoveryIsRunning) {
        await api.dispatch(discoveryActions.stop());
    }

    // const prevSuite = prevState.suite;
    // const prevDevice = prevSuite.device;
    // const prevDiscovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
    // const prevDiscovery
    // if (action.type === SUITE.SELECT_DEVICE) {
    //     if (prevDiscovery && prevDiscovery.status !== DISCOVERY_STATUS.COMPLETED) {
    //         await api.dispatch(discoveryActions.stop());
    //     }
    // }

    // propagate action to reducers
    await next(action);

    const nextState = api.getState();
    // code below runs only in wallet context
    if (nextState.router.app !== 'wallet') return action;
    // and only if device is unlocked
    const { locks } = nextState.suite;
    if (locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI)) return action;

    let authorizationIntent = false;
    const { device } = nextState.suite;
    // 1. selected device is acquired but doesn't have a state
    if (
        device &&
        device.features &&
        !device.state &&
        (action.type === SUITE.SELECT_DEVICE ||
            action.type === WALLET.INIT_SUCCESS ||
            action.type === DISCOVERY.STOP)
    ) {
        authorizationIntent = true;
    }

    // 2. selected device becomes acquired from unacquired
    if (action.type === SUITE.UPDATE_SELECTED_DEVICE) {
        const prevDevice = prevState.suite.device;
        if (prevDevice && !prevDevice.features && device && device.features) {
            authorizationIntent = true;
        }
    }

    // 3a. auth process
    if (authorizationIntent) {
        api.dispatch(suiteActions.requestPassphraseMode());
    }

    // 3b. auth process
    if (action.type === SUITE.RECEIVE_PASSPHRASE_MODE) {
        api.dispatch(suiteActions.authorizeDevice());
    }

    // 4. start or restart discovery
    if (
        action.type === SUITE.SELECT_DEVICE ||
        action.type === WALLET.INIT_SUCCESS ||
        action.type === SUITE.AUTH_DEVICE ||
        action.type === DISCOVERY.STOP ||
        (action.type === LOCATION_CHANGE && prevState.router.app !== 'wallet')
    ) {
        const discovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
        if (discovery && discovery.status !== DISCOVERY_STATUS.COMPLETED) {
            api.dispatch(discoveryActions.start());
        }
    }

    switch (action.type) {
        case DISCOVERY.UPDATE:
            // update discovery in selectedAccount
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;
        case LOCATION_CHANGE:
            // update selected account if needed
            api.dispatch(selectedAccountActions.observe(prevState, action));

            // dispatch wallet init, then load storage
            api.dispatch(walletActions.init());
            break;

        case WALLET.INIT:
            api.dispatch(loadStorage());
            break;

        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE:
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;
        default:
            break;
    }

    // TODO: copy all logic from old WalletService middleware
    const currentState = api.getState();
    if (action.type === LOCATION_CHANGE && prevState.router.hash !== currentState.router.hash) {
        // watch for account change
        if (
            prevState.router.params.accountId !== currentState.router.params.accountId ||
            prevState.router.params.symbol !== currentState.router.params.symbol
        ) {
            // we have switched the selected account
            // (couldn't this be called somewhere from selectedAccountActions instead of catching it like this)
            api.dispatch(selectedAccountActions.dispose());
        }
    }

    return action;
};

export default walletMiddleware;
