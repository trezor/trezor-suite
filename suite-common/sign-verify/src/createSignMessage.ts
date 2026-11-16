import { type Dispatch } from 'redux';

import { type AnalyticsDep, events } from '@suite-common/analytics';
import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { type TrezorDeviceWithState } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type Account } from '@suite-common/wallet-types';
import { DeviceNotConnectedError } from '@trezor/device';
import {
    type SignError,
    SignVerifyNotSupportedError,
    type SignatureFormat,
    type SignedMessage,
} from '@trezor/network-module-suite-common-types';
import { type Result, err } from '@trezor/type-utils';

import { getNetworkSignVerify } from './getNetworkSignVerify';
import { getErrorMessage, getFailureAttributes } from './signVerifyFailure';

export type SignMessageDeps = NetworkModuleRepositoryDep &
    AnalyticsDep & {
        dispatch: Dispatch;
    };

export type SignParams = {
    device: TrezorDeviceWithState;
    account: Account;
    path: string;
    message: string;
    hex: boolean;
    format?: SignatureFormat;
};

export type SignMessage = {
    sign: (params: SignParams) => Promise<Result<SignedMessage, SignError>>;
    getFormats: (account: Account) => readonly SignatureFormat[];
    getDefaultFormat: (account: Account) => SignatureFormat | undefined;
};

export const createSignMessage = (deps: SignMessageDeps): SignMessage => {
    const getFormats = (account: Account) => {
        const networkSignVerify = getNetworkSignVerify(deps, account);

        return networkSignVerify?.getFormats?.(account.symbol, account.accountType) ?? [];
    };

    const getDefaultFormat = (account: Account) => {
        const networkSignVerify = getNetworkSignVerify(deps, account);

        return networkSignVerify?.getDefaultFormat?.(account.symbol, account.accountType);
    };

    const signOnDevice = async ({
        device,
        account,
        path,
        message,
        hex,
        format,
    }: SignParams): Promise<Result<SignedMessage, SignError>> => {
        if (!device.connected) {
            return err(DeviceNotConnectedError('Device not connected: signMessage'));
        }

        const networkSignVerify = getNetworkSignVerify(deps, account);

        if (!networkSignVerify) {
            return err(SignVerifyNotSupportedError());
        }

        return await networkSignVerify.signMessage({
            device,
            symbol: account.symbol,
            accountIndex: account.index,
            accountType: account.accountType,
            path,
            message,
            hex,
            format,
        });
    };

    const sign: SignMessage['sign'] = async params => {
        const { account, hex } = params;
        const format = params.format ?? getDefaultFormat(account);
        // Networks signing in a single format never offered the choice, so reporting one of its
        // values would invent an answer the user never gave. The event has Bitcoin's formats only.
        const formatAttributes =
            getFormats(account).length > 1 && (format === 'trezor' || format === 'electrum')
                ? { signatureFormat: format }
                : {};

        const result = await signOnDevice({ ...params, format });

        if (!result.success) {
            deps.analytics.report({
                type: events.coinSignMessageEvent.name,
                payload: {
                    ...getFailureAttributes(result.error),
                    symbol: account.symbol,
                    hex,
                    ...formatAttributes,
                },
            });
            deps.dispatch(
                notificationsActions.addToast({
                    type: 'sign-message-error',
                    error: getErrorMessage(result.error),
                }),
            );

            return result;
        }

        deps.analytics.report({
            type: events.coinSignMessageEvent.name,
            payload: { status: 'success', symbol: account.symbol, hex, ...formatAttributes },
        });
        deps.dispatch(notificationsActions.addToast({ type: 'sign-message-success' }));

        return result;
    };

    return { sign, getFormats, getDefaultFormat };
};
