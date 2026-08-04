import { type ReactNode, createContext, useContext } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import type { AccountKey } from '@suite-common/wallet-types';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import {
    ReceiveAddressVerificationSource,
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { ReceiveAddressVerificationBottomSheet } from './ReceiveAddressVerificationBottomSheet';
import { useReceiveAddressCopy } from '../hooks/useReceiveAddressCopy';

type ReceiveAddressInteractionsContextValue = {
    handleCopyAddress: () => Promise<void>;
    handleVerifyAddress: (source: ReceiveAddressVerificationSource) => void;
};

const ReceiveAddressInteractionsContext = createContext<
    ReceiveAddressInteractionsContextValue | undefined
>(undefined);

type ReceiveAddressInteractionsProviderProps = {
    accountKey: AccountKey;
    address: string;
    addressPath: string;
    children: ReactNode;
};

type NavigationProp = StackNavigationProps<ReceiveStackParamList, ReceiveStackRoutes>;

export const ReceiveAddressInteractionsProvider = ({
    accountKey,
    address,
    addressPath,
    children,
}: ReceiveAddressInteractionsProviderProps) => {
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const navigation = useNavigation<NavigationProp>();

    const handleVerifyAddress = (source: ReceiveAddressVerificationSource) => {
        analytics.report({ type: events.receiveStartVerificationEvent.name });
        navigation.navigate(ReceiveStackRoutes.ReceiveAddressVerification, {
            accountKey,
            addressPath,
            source,
        });
    };

    const {
        copiedAddressBottomSheetRef,
        closeCopiedAddressBottomSheet,
        handleCopyAddress,
        handleVerifyCopiedAddress,
    } = useReceiveAddressCopy({ address, onVerifyAddress: handleVerifyAddress });

    const contextValue = { handleCopyAddress, handleVerifyAddress };

    return (
        <ReceiveAddressInteractionsContext.Provider value={contextValue}>
            {children}
            <ReceiveAddressVerificationBottomSheet
                ref={copiedAddressBottomSheetRef}
                source={ReceiveAddressVerificationSource.Pasted}
                onVerifyAddress={handleVerifyCopiedAddress}
                onSkipVerification={closeCopiedAddressBottomSheet}
            />
        </ReceiveAddressInteractionsContext.Provider>
    );
};

export const useReceiveAddressInteractions = () => {
    const context = useContext(ReceiveAddressInteractionsContext);

    if (context === undefined) {
        throw new Error(
            'useReceiveAddressInteractions must be used within ReceiveAddressInteractionsProvider',
        );
    }

    return context;
};
