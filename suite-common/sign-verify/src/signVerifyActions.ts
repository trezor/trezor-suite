import { type Dispatch } from 'redux';

import { type AnalyticsDep, type EventInstance, events } from '@suite-common/analytics';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { type ErrorCode, type SerializedError } from '@trezor/connect-common/src/constants/errors';
import { type WithServices } from '@trezor/redux-utils';
import { type Result } from '@trezor/type-utils';

import * as SIGN_VERIFY from './signVerifyConstants';

export type SignVerifyRootState = DeviceRootState;

const CANCEL_ERROR_CODES: ErrorCode[] = ['Method_Cancel', 'Failure_ActionCancelled'];

/**
 * What a verification attempt settled on.
 *
 * Rejecting the prompt on the device is not a verdict on the signature — the check never ran — so
 * it is reported apart from a signature that genuinely did not verify.
 */
export type VerifyMessageResult = 'verified' | 'failed' | 'cancelled';

const getFailureAttributes = ({
    code,
}: SerializedError): Pick<
    EventInstance<typeof events.coinSignMessageEvent>['payload'],
    'status' | 'error'
> => ({
    status: CANCEL_ERROR_CODES.includes(code) ? ('cancelled' as const) : ('error' as const),
    error: code,
});

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

export type SignVerifyAction =
    | { type: typeof SIGN_VERIFY.SIGN_SUCCESS; signSignature: string }
    | { type: typeof SIGN_VERIFY.VERIFY_SUCCESS };

type StateParams = {
    device: TrezorDevice;
    account: Account;
    coin: Account['symbol'];
};

const getStateParams = (
    account: Account,
    getState: () => SignVerifyRootState,
): Promise<StateParams> => {
    const device = selectSelectedDevice(getState());

    return !device || !device.connected || !device.available
        ? Promise.reject(new Error('Device not found'))
        : Promise.resolve({
              device,
              account,
              coin: account.symbol,
          });
};

export type SignedMessage = { signature: string; pubKey?: string };

const onSignSuccess = (dispatch: Dispatch) => (result: SignedMessage) => {
    dispatch(
        notificationsActions.addToast({
            type: 'sign-message-success',
        }),
    );
    dispatch({
        type: SIGN_VERIFY.SIGN_SUCCESS,
        signSignature: result.signature,
    });

    return result;
};

const onVerifySuccess = (dispatch: Dispatch) => () => {
    dispatch(
        notificationsActions.addToast({
            type: 'verify-message-success',
        }),
    );
    dispatch({
        type: SIGN_VERIFY.VERIFY_SUCCESS,
    });

    return true;
};

const onError =
    (dispatch: Dispatch, type: 'sign-message-error' | 'verify-message-error') =>
    (error: Error) => {
        dispatch(
            notificationsActions.addToast({
                type,
                error: error.message,
            }),
        );

        return false as const;
    };

type SignThunkState = SignVerifyRootState;

type SignThunkDeps = WithServices<AnalyticsDep>;

type SignMessageThunkParams = {
    account: Account;
    hex: boolean;
    /** Only for networks where the user picks the signature format; others never offered it. */
    signatureFormat?: 'trezor' | 'electrum';
    signMessage: (device: TrezorDevice) => Promise<Result<SignedMessage, SerializedError>>;
};

/**
 * What every network does around signing a message: finds the device, reports the outcome and
 * tells the user. The network provides only the call that signs.
 */
export const signMessageThunk =
    ({ account, hex, signatureFormat, signMessage }: SignMessageThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => SignThunkState,
        extra: SignThunkDeps,
    ): Promise<SignedMessage | false> => {
        const { analytics } = extra.services;
        const formatAttributes = signatureFormat === undefined ? {} : { signatureFormat };

        try {
            const { device } = await getStateParams(account, getState);
            const response = await signMessage(device);

            if (!response.success) {
                analytics.report({
                    type: events.coinSignMessageEvent.name,
                    payload: {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                        ...formatAttributes,
                    },
                });

                return onError(dispatch, 'sign-message-error')(new Error(response.error.message));
            }

            analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex, ...formatAttributes },
            });

            return onSignSuccess(dispatch)(response.payload);
        } catch (error) {
            analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                    ...formatAttributes,
                },
            });

            return onError(dispatch, 'sign-message-error')(asError(error));
        }
    };

type VerifyThunkState = SignVerifyRootState;

type VerifyThunkDeps = WithServices<AnalyticsDep>;

type VerifyMessageThunkParams = {
    account: Account;
    hex: boolean;
    verifyMessage: (device: TrezorDevice) => Promise<Result<unknown, SerializedError>>;
};

/**
 * What every network does around verifying a message: finds the device, reports the outcome and
 * tells the user. The network provides only the call that verifies.
 */
export const verifyMessageThunk =
    ({ account, hex, verifyMessage }: VerifyMessageThunkParams) =>
    async (
        dispatch: Dispatch,
        getState: () => VerifyThunkState,
        extra: VerifyThunkDeps,
    ): Promise<VerifyMessageResult> => {
        const { analytics } = extra.services;

        try {
            const { device } = await getStateParams(account, getState);
            const response = await verifyMessage(device);

            if (!response.success) {
                analytics.report({
                    type: events.coinVerifyMessageEvent.name,
                    payload: {
                        ...getFailureAttributes(response.error),
                        symbol: account.symbol,
                        hex,
                    },
                });

                if (CANCEL_ERROR_CODES.includes(response.error.code)) {
                    // The user backed out on the device, which says nothing about the signature.
                    // Still say so: the prompt disappearing with the form untouched leaves no other
                    // sign that the check was dropped rather than quietly failing.
                    dispatch(notificationsActions.addToast({ type: 'verify-message-cancelled' }));

                    return 'cancelled';
                }

                onError(dispatch, 'verify-message-error')(new Error(response.error.message));

                return 'failed';
            }

            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: { status: 'success', symbol: account.symbol, hex },
            });

            onVerifySuccess(dispatch)();

            return 'verified';
        } catch (error) {
            analytics.report({
                type: events.coinVerifyMessageEvent.name,
                payload: {
                    status: 'error',
                    error: asError(error).message,
                    symbol: account.symbol,
                    hex,
                },
            });

            onError(dispatch, 'verify-message-error')(asError(error));

            return 'failed';
        }
    };
