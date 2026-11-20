import { getTxsPerPage } from '@suite-common/suite-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect, {
    type DiscoveryAccountInfoParams,
    ERRORS,
    type StaticSessionId,
    UI_RESPONSE,
} from '@trezor/connect';

import { type BlockchainRootState, selectGapLimit } from '../blockchain/blockchainReducer';

type CreateAccountInfoRequestListenerParams = {
    callId: string;
    deviceState: StaticSessionId;
    getState: () => BlockchainRootState;
};

type AccountInfoRequest = DiscoveryAccountInfoParams & { requestId: string; callId?: string };

/**
 * Creates a listener of `UI_REQUESTS.REQUEST_DISCOVERY_ACCOUNT_INFO` reading the accounts that
 * Connect's discoverAccounts call with the given callId asks for from the backend.
 */
export const createAccountInfoRequestListener =
    ({ callId, deviceState, getState }: CreateAccountInfoRequestListenerParams) =>
    ({ requestId, callId: requestCallId, ...params }: AccountInfoRequest) => {
        if (requestCallId !== callId) return;

        const { symbol, networkType } = getNetwork(params.coin);
        // Connect waits for the answer while holding the device, so even a rejection is answered.
        TrezorConnect.getAccountInfo({
            ...params,
            pageSize: getTxsPerPage(networkType),
            identity: tryGetAccountIdentity({ networkType, deviceState }),
            protocols: networkType === 'ethereum' ? ['erc4626'] : undefined,
            gap: networkType === 'bitcoin' ? selectGapLimit(getState(), symbol) : undefined,
        })
            .catch(error => ({ success: false as const, error: ERRORS.serializeError(error) }))
            .then(response =>
                TrezorConnect.uiResponse({
                    type: UI_RESPONSE.RECEIVE_DISCOVERY_ACCOUNT_INFO,
                    payload: response,
                    requestId,
                }),
            );
    };
