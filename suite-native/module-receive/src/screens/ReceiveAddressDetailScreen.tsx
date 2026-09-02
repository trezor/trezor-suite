import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { parseAccountKey } from '@suite-common/wallet-utils';
import { ErrorMessage, ScreenFooterGradient, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    type ReceiveStackParamList,
    type ReceiveStackRoutes,
    Screen,
    ScreenHeader,
} from '@suite-native/navigation';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';
import { ReceiveAddressActions } from '../components/ReceiveAddressActions';
import { ReceiveAddressDetailHeader } from '../components/ReceiveAddressDetailHeader';
import { ReceiveAddressDetails } from '../components/ReceiveAddressDetails';
import { ReceiveAddressInteractionsProvider } from '../components/ReceiveAddressInteractionsProvider';
import { ReceiveAddressReuseWarning } from '../components/ReceiveAddressReuseWarning';
import { type ReceiveAddressRootState, selectReceiveAccountAddressByPath } from '../selectors';

export const ReceiveAddressDetailScreen = () => {
    const {
        params: { accountKey, addressPath },
    } = useRoute<RouteProp<ReceiveStackParamList, ReceiveStackRoutes.ReceiveAddressDetail>>();
    const { accountDescriptor, networkSymbol, deviceStaticSessionId } = parseAccountKey(accountKey);

    const address = useSelector((state: ReceiveAddressRootState) =>
        selectReceiveAccountAddressByPath(state, accountKey, addressPath),
    );
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) {
        return <ReceiveBlockedDeviceCompromisedScreen />;
    }

    if (!address) {
        return (
            <Screen
                header={
                    <ScreenHeader
                        closeActionType="back"
                        title={<Translation id="moduleReceive.addressDetail.title" />}
                    />
                }
            >
                <ErrorMessage errorMessage={<Translation id="generic.unknownError" />} />
            </Screen>
        );
    }

    const isUsed = address.transfers > 0;

    return (
        <ReceiveAddressInteractionsProvider
            accountKey={accountKey}
            address={address.address}
            addressPath={addressPath}
        >
            <Screen
                header={<ReceiveAddressDetailHeader address={address} symbol={networkSymbol} />}
                footer={
                    <>
                        <ScreenFooterGradient />
                        <VStack paddingHorizontal="sp16" paddingTop="sp8" paddingBottom="sp16">
                            <ReceiveAddressActions address={address.address} />
                        </VStack>
                    </>
                }
                noBottomPadding
            >
                <VStack marginTop="sp8" spacing="sp16" flex={1}>
                    <ReceiveAddressDetails
                        accountDescriptor={accountDescriptor}
                        address={address.address}
                        deviceStaticSessionId={deviceStaticSessionId}
                        networkSymbol={networkSymbol}
                    />
                    {isUsed && <ReceiveAddressReuseWarning />}
                </VStack>
            </Screen>
        </ReceiveAddressInteractionsProvider>
    );
};
