import { type Dispatch } from 'redux';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import {
    type SignVerifyRootState,
    asError,
    getFailureAttributes,
    getSignVerifyStateParams,
    notifyError,
    notifySignSuccess,
    reportSignMessage,
} from '@suite/sign-verify';
import { type WithServices } from '@suite-common/redux-utils';
import { type AccountWithNetworkType } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';
import { type GetTrezorConnectDep, getSerializedPath } from '@trezor/connect-common';
import { MessagesSchema } from '@trezor/protobuf';

export type CardanoSignVerifyConnectDep = GetTrezorConnectDep<'cardanoSignMessage'>;

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = WithServices<DesktopAnalyticsDep>;

type CardanoAccount = AccountWithNetworkType<'cardano'>;

export type CardanoSignVerifyActions = ReturnType<typeof createCardanoSignVerifyActions>;

export const createCardanoSignVerifyActions = ({
    getTrezorConnect,
}: CardanoSignVerifyConnectDep) => {
    const signThunk =
        (
            account: CardanoAccount,
            path: string | number[],
            message: string,
            hex = false,
            isCose = false,
        ) =>
        async (dispatch: Dispatch, getState: () => SignThunkState, extra: SignThunkDeps) => {
            const { analytics } = extra.services;

            try {
                const { device } = await getSignVerifyStateParams(account, getState);
                const payload = hex ? message : Buffer.from(message, 'utf8').toString('hex');
                const serializedPath = typeof path === 'string' ? path : getSerializedPath(path);
                const stakingPath = getStakingPath(account);
                const addressParameters =
                    path === stakingPath
                        ? {
                              addressType: MessagesSchema.CardanoAddressType.REWARD,
                              stakingPath,
                          }
                        : getAddressParameters(account, serializedPath);

                const response = await getTrezorConnect().cardanoSignMessage({
                    device,
                    path,
                    payload,
                    addressParameters,
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(),
                    derivationType: getDerivationType(account.accountType),
                });

                if (!response.success) {
                    reportSignMessage(analytics, {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                    });

                    return notifyError(
                        dispatch,
                        'sign-message-error',
                    )(new Error(response.error.message));
                }

                reportSignMessage(analytics, {
                    status: 'success',
                    symbol: account.symbol,
                    hex,
                });

                return notifySignSuccess(dispatch)({
                    signature: response.payload.coseSignature,
                    pubKey: isCose ? response.payload.coseKey : response.payload.pubKey,
                    address: response.payload.headers.protected.address,
                });
            } catch (error) {
                reportSignMessage(analytics, {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                });

                return notifyError(dispatch, 'sign-message-error')(asError(error));
            }
        };

    return { signThunk };
};
