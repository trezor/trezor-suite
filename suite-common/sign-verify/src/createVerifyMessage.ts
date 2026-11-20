import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type Account } from '@suite-common/wallet-types';
import {
    SignVerifyNotSupportedError,
    type VerifyError,
} from '@trezor/network-module-suite-common-types';
import { type Result, err } from '@trezor/type-utils';

import { type SignVerifyReporterDep } from './createSignVerifyReporter';
import { getNetworkSignVerify } from './getNetworkSignVerify';

export type VerifyMessageDeps = NetworkModuleRepositoryDep & SignVerifyReporterDep;

export type VerifyParams = {
    device: TrezorDevice | undefined;
    account: Account;
    address: string;
    message: string;
    signature: string;
    hex: boolean;
};

export type VerifyMessage = {
    verify: (params: VerifyParams) => Promise<Result<void, VerifyError>>;
    isVerifySupported: (account: Account) => boolean;
};

export const createVerifyMessage = (deps: VerifyMessageDeps): VerifyMessage => {
    const isVerifySupported = (account: Account) =>
        getNetworkSignVerify(deps, account)?.verifyMessage !== undefined;

    const verify: VerifyMessage['verify'] = ({
        device,
        account,
        address,
        message,
        signature,
        hex,
    }) =>
        deps.signVerifyReporter.verifyAndReport(
            { device, symbol: account.symbol, hex },
            async readyDevice => {
                const verifyMessage = getNetworkSignVerify(deps, account)?.verifyMessage;

                if (!verifyMessage) {
                    return err(SignVerifyNotSupportedError());
                }

                return await verifyMessage({
                    device: readyDevice,
                    symbol: account.symbol,
                    address,
                    message,
                    signature,
                    hex,
                });
            },
        );

    return { verify, isVerifySupported };
};
