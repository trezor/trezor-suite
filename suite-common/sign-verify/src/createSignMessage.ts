import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import {
    type SignError,
    SignVerifyNotSupportedError,
    type SignatureFormat,
    type SignedMessage,
} from '@trezor/network-module-suite-common-types';
import { type Result, err } from '@trezor/type-utils';

import { type SignVerifyReporterDep } from './createSignVerifyReporter';
import { getNetworkSignVerify } from './getNetworkSignVerify';

export type SignMessageDeps = NetworkModuleRepositoryDep & SignVerifyReporterDep;

export type SignParams = {
    device: TrezorDevice | undefined;
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

    const sign: SignMessage['sign'] = ({ device, account, path, message, hex, ...params }) => {
        const format = params.format ?? getDefaultFormat(account);
        // Networks signing in a single format never offered the choice, so reporting one of its
        // values would invent an answer the user never gave. The event has Bitcoin's formats only.
        const signatureFormat =
            getFormats(account).length > 1 && (format === 'trezor' || format === 'electrum')
                ? format
                : undefined;

        return deps.signVerifyReporter.signAndReport(
            { device, symbol: account.symbol, hex, signatureFormat },
            async readyDevice => {
                const networkSignVerify = getNetworkSignVerify(deps, account);

                if (!networkSignVerify) {
                    return err(SignVerifyNotSupportedError());
                }

                return await networkSignVerify.signMessage({
                    device: readyDevice,
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                    path,
                    message,
                    hex,
                    format,
                });
            },
        );
    };

    return { sign, getFormats, getDefaultFormat };
};
