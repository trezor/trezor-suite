import { MiddlewareAPI } from 'redux';
import TrezorConnect, { UI } from 'trezor-connect';
import { SUITE, ROUTER, MODAL } from '@suite-actions/constants';
import { ACCOUNT, DISCOVERY } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as suiteActions from '@suite-actions/suiteActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as accountActions from '@wallet-actions/accountActions';
import { getApp } from '@suite-utils/router';
import { AppState, Action, Dispatch } from '@suite-types';

const discoveryMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    async (action: Action): Promise<Action> => {
        const prevState = api.getState();
        const prevDiscovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
        const discoveryIsRunning =
            prevDiscovery &&
            prevDiscovery.status > DISCOVERY.STATUS.IDLE &&
            prevDiscovery.status < DISCOVERY.STATUS.STOPPING;

        if (action.type === SUITE.FORGET_DEVICE && action.payload.state) {
            api.dispatch(discoveryActions.remove(action.payload.state));
        }

        // temporary workaround, needs to be changed in trezor-connect
        // BLOCK action propagation (via next() function) and respond to trezor-connect
        // otherwise devices without backup will receive several "confirmation" modals during discovery process
        const isCoinmarketExchange = prevState.router.route?.name === 'wallet-coinmarket-exchange';

        if (
            action.type === UI.REQUEST_CONFIRMATION &&
            (discoveryIsRunning || isCoinmarketExchange)
        ) {
            TrezorConnect.uiResponse({
                type: UI.RECEIVE_CONFIRMATION,
                payload: true,
            });
            return action;
        }

        // do not close user context modals during discovery
        if (action.type === UI.CLOSE_UI_WINDOW && discoveryIsRunning) {
            const { modal } = prevState;
            if (modal.context === MODAL.CONTEXT_USER) {
                return action;
            }
        }

        // consider if discovery should be interrupted
        let interruptionIntent = action.type === SUITE.SELECT_DEVICE;
        if (action.type === ROUTER.LOCATION_CHANGE) {
            interruptionIntent =
                getApp(action.payload.url) !== 'wallet' &&
                getApp(action.payload.url) !== 'dashboard';
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
        if (nextState.router.app !== 'wallet' && nextState.router.app !== 'dashboard')
            return action;

        let authorizationIntent = false;
        const { device, locks } = nextState.suite;
        // 1. selected device is acquired but doesn't have a state
        if (
            device &&
            device.features &&
            !device.state &&
            !locks.includes(SUITE.LOCK_TYPE.DEVICE) &&
            (action.type === SUITE.SELECT_DEVICE || action.type === SUITE.APP_CHANGED)
        ) {
            authorizationIntent = true;
        }

        // 2. selected device becomes acquired from unacquired or connected from disconnected
        let becomesConnected = false;
        if (action.type === SUITE.UPDATE_SELECTED_DEVICE) {
            const prevDevice = prevState.suite.device;
            const becomesAcquired = !!(
                prevDevice &&
                !prevDevice.features &&
                device &&
                device.features
            );
            becomesConnected = !!(
                prevDevice &&
                !prevDevice.connected &&
                device &&
                device.connected
            );
            if (becomesAcquired) {
                authorizationIntent = true;
            }
        }

        // 3. begin auth process
        if (authorizationIntent) {
            api.dispatch(suiteActions.authorizeDevice());
        }

        // 4. device state received
        if (action.type === SUITE.AUTH_DEVICE) {
            // `device` is always present here
            // to avoid typescript conditioning use device from action as a fallback (never used)
            api.dispatch(discoveryActions.create(action.state, device || action.payload));
        }

        // 5. device state confirmation received
        if (action.type === SUITE.RECEIVE_AUTH_CONFIRM && action.payload.state) {
            // from discovery point of view it's irrelevant if authConfirm fails
            // it's a device matter now
            api.dispatch(
                discoveryActions.update({
                    deviceState: action.payload.state,
                    authConfirm: false,
                }),
            );
        }

        // 6. start or restart discovery
        if (
            becomesConnected ||
            action.type === SUITE.APP_CHANGED ||
            action.type === SUITE.SELECT_DEVICE ||
            action.type === SUITE.AUTH_DEVICE ||
            action.type === WALLET_SETTINGS.CHANGE_NETWORKS ||
            action.type === ACCOUNT.CHANGE_VISIBILITY
        ) {
            const discovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
            if (
                device &&
                device.connected &&
                !device.authFailed &&
                !device.authConfirm &&
                discovery &&
                (discovery.status === DISCOVERY.STATUS.IDLE ||
                    discovery.status >= DISCOVERY.STATUS.STOPPED)
            ) {
                api.dispatch(discoveryActions.start());
            }
        }

        return action;
    };

export default discoveryMiddleware;
