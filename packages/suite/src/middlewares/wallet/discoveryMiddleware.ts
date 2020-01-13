import { MiddlewareAPI } from 'redux';
import TrezorConnect, { UI } from 'trezor-connect';
import { SUITE, ROUTER, MODAL } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { DISCOVERY_STATUS } from '@wallet-reducers/discoveryReducer';
import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as accountActions from '@wallet-actions/accountActions';
import { getApp } from '@suite-utils/router';
import { AppState, Action, Dispatch } from '@suite-types';

const discoveryMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const prevState = api.getState();
    const prevDiscovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
    const discoveryIsRunning =
        prevDiscovery &&
        prevDiscovery.status > DISCOVERY_STATUS.IDLE &&
        prevDiscovery.status < DISCOVERY_STATUS.STOPPING;

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

    // do not close "device instance" modal during discovery
    if (action.type === UI.CLOSE_UI_WINDOW && discoveryIsRunning) {
        const { modal } = prevState;
        if (
            modal.context === MODAL.CONTEXT_DEVICE &&
            modal.windowType === SUITE.REQUEST_DEVICE_INSTANCE
        ) {
            return action;
        }
    }

    // consider if discovery should be interrupted
    let interruptionIntent = action.type === SUITE.SELECT_DEVICE;
    if (action.type === ROUTER.LOCATION_CHANGE) {
        interruptionIntent = getApp(action.url) !== 'wallet' && getApp(action.url) !== 'dashboard';
    }

    // discovery interruption ends after DISCOVERY.STOP action
    // action which triggers this interruption will be propagated AFTER stop
    if (interruptionIntent && discoveryIsRunning) {
        await api.dispatch(discoveryActions.stop());
    }

    // pass action
    await next(action);

    if (action.type === WALLET_SETTINGS.CHANGE_NETWORKS) {
        // update Discovery fields
        api.dispatch(discoveryActions.updateNetworkSettings());
        // remove accounts which are no longer part of Discovery
        api.dispatch(accountActions.disableAccounts());
    }

    const nextState = api.getState();
    // code below runs only in wallet context
    if (nextState.router.app !== 'wallet' && nextState.router.app !== 'dashboard') return action;

    let authorizationIntent = false;
    const { device } = nextState.suite;
    // 1. selected device is acquired but doesn't have a state
    if (
        device &&
        device.features &&
        !device.state &&
        (action.type === SUITE.SELECT_DEVICE || action.type === SUITE.APP_CHANGED)
    ) {
        authorizationIntent = true;
    }

    // 2. selected device becomes acquired from unacquired or connected from disconnected
    let becomesConnected = false;
    if (action.type === SUITE.UPDATE_SELECTED_DEVICE) {
        const prevDevice = prevState.suite.device;
        const becomesAcquired = !!(prevDevice && !prevDevice.features && device && device.features);
        becomesConnected = !!(prevDevice && !prevDevice.connected && device && device.connected);
        if (becomesAcquired) {
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

    if (action.type === SUITE.AUTH_DEVICE) {
        api.dispatch(discoveryActions.create(action.state));
    }

    // 4. start or restart discovery
    if (
        becomesConnected ||
        action.type === SUITE.APP_CHANGED ||
        action.type === SUITE.SELECT_DEVICE ||
        action.type === SUITE.AUTH_DEVICE ||
        action.type === WALLET_SETTINGS.CHANGE_NETWORKS ||
        action.type === ACCOUNT.CHANGE_VISIBILITY ||
        (action.type === ROUTER.LOCATION_CHANGE && prevState.router.app !== 'wallet')
    ) {
        const discovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
        if (
            device &&
            device.connected &&
            discovery &&
            (discovery.status === 0 || discovery.status >= DISCOVERY_STATUS.STOPPED)
        ) {
            api.dispatch(discoveryActions.start());
        }
    }

    return action;
};

export default discoveryMiddleware;
