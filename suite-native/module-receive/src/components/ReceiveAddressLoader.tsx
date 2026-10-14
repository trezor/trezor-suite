import { useWindowDimensions } from 'react-native';

import { type TokenAddress } from '@suite-common/wallet-types';
import { BoxSkeleton, Card, VStack } from '@suite-native/atoms';
import { type CloseActionType, Screen } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ReceiveFreshAddressHeader } from './ReceiveFreshAddressHeader';

const cardStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp8,
}));

type ReceiveAddressLoaderProps = {
    tokenContract?: TokenAddress;
    closeActionType: CloseActionType;
};

export const ReceiveAddressLoader = ({
    tokenContract,
    closeActionType,
}: ReceiveAddressLoaderProps) => {
    const { applyStyle } = useNativeStyles();
    const { width: windowWidth } = useWindowDimensions();

    return (
        <Screen
            header={
                <ReceiveFreshAddressHeader
                    tokenContract={tokenContract}
                    closeActionType={closeActionType}
                />
            }
        >
            <VStack spacing="sp32" alignItems="center" paddingHorizontal="sp8">
                <Card style={applyStyle(cardStyle)}>
                    <BoxSkeleton width={windowWidth - 32} height={70} />
                </Card>
                <Card style={applyStyle(cardStyle)}>
                    <VStack spacing="sp24" alignItems="center" paddingHorizontal="sp24">
                        <BoxSkeleton width={windowWidth - 80} height={200} />
                        <BoxSkeleton width={windowWidth - 80} height={48} borderRadius={24} />
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
