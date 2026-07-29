import { selectFullSelectedAccount } from '@suite/account';
import { selectSuiteNetworkModuleRepositoryDep } from '@suite/networks';
import { SignVerify } from '@suite/sign-verify';
import { useServices } from '@suite-common/dependency-injection';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

export const SignVerifyPage = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const { suiteNetworkModuleRepository } = useServices(selectSuiteNetworkModuleRepositoryDep);
    const suiteNetworkModule = suiteNetworkModuleRepository.get(selectedAccount.account!.symbol);

    if (!suiteNetworkModule) {
        throw new Error(
            `Sign & Verify network module for ${selectedAccount.account!.symbol} is not registered.`,
        );
    }

    return (
        <SignVerify
            account={selectedAccount.account!}
            network={selectedAccount.network}
            networkModule={suiteNetworkModule}
            renderShell={({ title, isDeviceConnected, headingAction, children }) => (
                <WalletLayout title={title} isSubpage account={selectedAccount}>
                    <WalletSubpageHeading title={title}>{headingAction}</WalletSubpageHeading>

                    {!isDeviceConnected && <ConnectDeviceGenericPromo />}

                    {children}
                </WalletLayout>
            )}
        />
    );
};
