import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { selectCurrentFreshAddress } from '@suite-common/receive';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { ErrorMessage, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { type CloseActionType, Screen } from '@suite-native/navigation';

import { ReceiveAddressActions } from './ReceiveAddressActions';
import { ReceiveAddressCard } from './ReceiveAddressCard';
import { ReceiveAddressLoader } from './ReceiveAddressLoader';
import { ReceiveDestinationTagInfo } from './ReceiveDestinationTagInfo';
import { ReceiveFreshAddressHeader } from './ReceiveFreshAddressHeader';
import { useReceiveAddressVerification } from '../hooks/useReceiveAddressVerification';
import { setCurrentFreshAddressForFlowEntryThunk } from '../receiveThunks';
import { ReceiveBlockedDeviceCompromisedScreen } from '../screens/ReceiveBlockedDeviceCompromisedScreen';
import { type ReceiveAddressListRootState } from '../selectors';

type ReceiveAddressContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
};

export const ReceiveAddressContent = ({
    accountKey,
    tokenContract,
    closeActionType,
}: ReceiveAddressContentProps) => {
    const dispatch = useDispatch();
    const [initializedAccountKey, setInitializedAccountKey] = useState<AccountKey | null>(null);

    const currentFreshAddress = useSelector((state: ReceiveAddressListRootState) =>
        selectCurrentFreshAddress(state, accountKey),
    );

    useFocusEffect(
        useCallback(() => {
            if (initializedAccountKey === accountKey) {
                return;
            }

            dispatch(setCurrentFreshAddressForFlowEntryThunk({ accountKey }));
            setInitializedAccountKey(accountKey);
        }, [accountKey, dispatch, initializedAccountKey]),
    );

    const { verifyAddressOnDevice } = useReceiveAddressVerification(
        accountKey,
        currentFreshAddress?.path,
    );

    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );
    const hasInitializedCurrentFreshAddress = initializedAccountKey === accountKey;

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    if (!hasInitializedCurrentFreshAddress) {
        return (
            <ReceiveAddressLoader tokenContract={tokenContract} closeActionType={closeActionType} />
        );
    }

    if (!currentFreshAddress) {
        return <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />;
    }

    return (
        <Screen
            header={
                <ReceiveFreshAddressHeader
                    accountKey={accountKey}
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            }
            footer={
                <>
                    <ScreenFooterGradient />
                    <VStack paddingHorizontal="sp16" paddingTop="sp8" paddingBottom="sp16">
                        <ReceiveAddressActions
                            address={currentFreshAddress.address}
                            onVerifyAddress={verifyAddressOnDevice}
                        />
                    </VStack>
                </>
            }
            noBottomPadding
        >
            <VStack marginTop="sp8" spacing="sp16" flex={1}>
                <ReceiveAddressCard
                    accountKey={accountKey}
                    address={currentFreshAddress.address}
                    tokenContract={tokenContract}
                />
                <ReceiveDestinationTagInfo accountKey={accountKey} tokenContract={tokenContract} />
            </VStack>
        </Screen>
    );
};
