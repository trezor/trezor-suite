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
import { getReadyDevice } from './getReadyDevice';

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

    const verifyOnDevice = async ({
        device,
        account,
        address,
        message,
        signature,
        hex,
    }: VerifyParams): Promise<Result<void, VerifyError>> => {
        const readyDevice = getReadyDevice(device, 'verifyMessage');
        const verifyMessage = getNetworkSignVerify(deps, account)?.verifyMessage;

        if (!readyDevice.success) {
            return readyDevice;
        }

        if (!verifyMessage) {
            return err(SignVerifyNotSupportedError());
        }

        return await verifyMessage({
            device: readyDevice.payload,
            symbol: account.symbol,
            address,
            message,
            signature,
            hex,
        });
    };

    const verify: VerifyMessage['verify'] = async params => {
        const result = await verifyOnDevice(params);
        deps.signVerifyReporter.reportVerify(
            { symbol: params.account.symbol, hex: params.hex },
            result,
        );

        return result;
    };

    return { verify, isVerifySupported };
};
