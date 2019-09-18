import { MiddlewareAPI } from 'redux';
import TrezorConnect, { UI, AccountInfo } from 'trezor-connect';
import { LOCATION_CHANGE } from '@suite-actions/routerActions';
import * as suiteActions from '@suite-actions/suiteActions';
import { SUITE } from '@suite-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import { loadStorage } from '@wallet-actions/storageActions';
import * as walletActions from '@wallet-actions/walletActions';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import { STATUS } from '@wallet-reducers/discoveryReducer';

import { WALLET, DISCOVERY, ACCOUNT } from '@wallet-actions/constants';
import { AppState, Action, Dispatch } from '@suite-types';

// Flow: LOCATION.CHANGE -> WALLET.INIT -> load storage -> WALLET.INIT_SUCCESS
const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (
    action: Action,
): Promise<Action> => {
    const prevState = api.getState();
    const prevDevice = prevState.suite.device;
    const prevDiscovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
    if (action.type === SUITE.SELECT_DEVICE) {
        if (prevDiscovery && prevDiscovery.status !== STATUS.COMPLETED) {
            await api.dispatch(discoveryActions.stop());
        }
    }

    // TODO: temporary workaround, needs to be fixed in trezor-connect
    if (
        action.type === UI.REQUEST_CONFIRMATION &&
        prevDiscovery &&
        prevDiscovery.status !== STATUS.COMPLETED
    ) {
        await TrezorConnect.uiResponse({
            type: UI.RECEIVE_CONFIRMATION,
            payload: true,
        });
        return action;
    }

    // pass action
    await next(action);

    // runs only in wallet app
    if (api.getState().router.app !== 'wallet') return action;

    const { suite } = api.getState();

    if (action.type === SUITE.SELECT_DEVICE || action.type === WALLET.INIT_SUCCESS) {
        const discovery = api.dispatch(discoveryActions.getDiscoveryForDevice());
        if (discovery && discovery.status !== STATUS.COMPLETED) {
            api.dispatch(discoveryActions.start());
        } else {
            api.dispatch(suiteActions.requestPassphraseMode());
        }
    }
    if (action.type === SUITE.UPDATE_SELECTED_DEVICE) {
        // unacquired device becomes acquired
        if (prevDevice && !prevDevice.features && action.payload && action.payload.features) {
            api.dispatch(suiteActions.requestPassphraseMode());
        }
    }
    if (!suite.deviceLocked && action.type === SUITE.RECEIVE_PASSPHRASE_MODE) {
        api.dispatch(suiteActions.authorizeDevice());
    }
    if (prevState.suite.deviceLocked && action.type === DISCOVERY.STOP) {
        api.dispatch(suiteActions.authorizeDevice());
    }
    if (action.type === SUITE.AUTH_DEVICE) {
        api.dispatch(discoveryActions.start());
    }

    switch (action.type) {
        case ACCOUNT.CREATE:
            {
                const account = action.payload;
                const { transactions } = account.history;
                if (transactions) {
                    // add last 25 txs to the history
                    const enhancedTxs = transactions.map(tx => ({
                        accountDescriptor: account.descriptor,
                        page: 1,
                        ...tx,
                    }));
                    api.dispatch(transactionActions.add(enhancedTxs));
                }
            }
            break;

        case ACCOUNT.UPDATE:
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;

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
            prevState.router.params.symbol !== currentState.router.params.symbol ||
            prevState.router.params.accountType !== currentState.router.params.accountType
        ) {
            // we have switched the selected account
            // (couldn't this be called somewhere from selectedAccountActions instead of catching it like this)
            api.dispatch(selectedAccountActions.dispose());
        }
    }

    return action;
};

export default walletMiddleware;
