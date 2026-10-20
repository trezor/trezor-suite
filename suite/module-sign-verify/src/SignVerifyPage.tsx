import { type ComponentType } from 'react';
import { useSelector } from 'react-redux';

import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { useServices } from '@trezor/dependency-injection';
import { injectSuiteNetworkModuleRepository } from '@trezor/network-module-suite-types';

import { type SignVerifyLayoutProps } from './SignVerifyLayoutProps';

type SignVerifyPageProps = {
    LayoutComponent: ComponentType<SignVerifyLayoutProps>;
};

export const SignVerifyPage = ({ LayoutComponent }: SignVerifyPageProps) => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { suiteNetworkModuleRepository } = useServices(injectSuiteNetworkModuleRepository);
    const { device, isLocked } = useDevice();
    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    const { signVerify } = suiteNetworkModuleRepository.get(account.symbol);

    if (signVerify === null) {
        return null;
    }

    const { Component, canVerify } = signVerify;

    return (
        <LayoutComponent
            account={selectedAccount}
            title={canVerify ? 'TR_NAV_SIGN_VERIFY' : 'TR_SIGN_MESSAGE'}
            isDeviceConnected={Boolean(device?.connected && device?.available)}
        >
            <Component account={account} isDeviceLocked={isLocked()} />
        </LayoutComponent>
    );
};
