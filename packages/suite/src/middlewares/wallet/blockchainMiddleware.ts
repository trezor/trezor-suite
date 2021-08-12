import { MiddlewareAPI } from 'redux';
import { BLOCKCHAIN } from 'trezor-connect';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import { AppState, Action, Dispatch } from '@suite-types';

const blockchainMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        // propagate action to reducers
        next(action);

        switch (action.type) {
            case BLOCKCHAIN.CONNECT:
                api.dispatch(blockchainActions.onConnect(action.payload.coin.shortcut));
                break;
            case BLOCKCHAIN.BLOCK:
                api.dispatch(blockchainActions.updateFeeInfo(action.payload.coin.shortcut));
                api.dispatch(blockchainActions.onBlockMined(action.payload));
                break;
            case BLOCKCHAIN.NOTIFICATION:
                api.dispatch(blockchainActions.onNotification(action.payload));
                break;
            case BLOCKCHAIN.ERROR:
                api.dispatch(blockchainActions.onDisconnect(action.payload));
                break;
            default:
                break;
        }

        return action;
    };

export default blockchainMiddleware;
