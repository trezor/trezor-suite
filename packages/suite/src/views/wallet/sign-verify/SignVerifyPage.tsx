import { selectFullSelectedAccount } from '@suite/account';
import { useDevice } from '@suite/device';
import { selectSuiteNetworkModuleRepositoryDep } from '@suite/networks';
import { useServices } from '@suite-common/dependency-injection';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

export const SignVerifyPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { suiteNetworkModuleRepository } = useServices(selectSuiteNetworkModuleRepositoryDep);
    const { device } = useDevice();
    const { account } = selectedAccount;

    if (account === undefined) {
        return null;
    }

    const { signVerify } = suiteNetworkModuleRepository.get(account.symbol);

    if (signVerify === null) {
        return null;
    }

    const { Component, title } = signVerify;
    const isDeviceConnected = device?.connected && device?.available;

    return (
        <WalletLayout title={title} isSubpage account={selectedAccount}>
            <WalletSubpageHeading title={title} />

            {!isDeviceConnected && <ConnectDeviceGenericPromo />}

            <Component account={account} />
        </WalletLayout>
    );
};
