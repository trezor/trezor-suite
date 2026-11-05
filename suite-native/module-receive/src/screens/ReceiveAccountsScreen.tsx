import { useSelector } from 'react-redux';

import { toTokenAddress, toTokenSymbol } from '@suite-common/wallet-types';
import { AccountsList, type OnSelectAccount } from '@suite-native/accounts';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import {
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    Screen,
    type StackProps,
} from '@suite-native/navigation';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';
import { ReceiveAccountsHeader } from '../components/ReceiveAccountsHeader';
import { useReceiveNavigation } from '../hooks/useReceiveNavigation';

export const ReceiveAccountsScreen = ({
    route,
}: StackProps<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAccounts>) => {
    const { asset, closeActionType } = route.params;

    const { navigateToReceiveAddressScreen } = useReceiveNavigation();

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    const tokenContract = asset.isNativeToken ? undefined : toTokenAddress(asset.contractAddress);
    const tokenSymbol = asset.isNativeToken ? undefined : toTokenSymbol(asset.symbol);

    const onSelectAccount: OnSelectAccount = args => {
        navigateToReceiveAddressScreen({
            ...args,
            tokenAddress: tokenContract,
        });
    };

    return (
        <Screen
            header={<ReceiveAccountsHeader asset={asset} closeActionType={closeActionType} />}
            isScrollable={false}
            noHorizontalPadding
            noBottomPadding
            hasBottomInset={false}
        >
            <AccountsList
                onSelectAccount={onSelectAccount}
                networkFilter={[asset.networkSymbol]}
                tokenContract={tokenContract}
                tokenSymbol={tokenSymbol}
            />
        </Screen>
    );
};
