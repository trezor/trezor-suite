import { useDispatch } from 'react-redux';

import {
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { IconButton, VStack } from '@suite-native/atoms';
import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';

import { ReviewOutputItemList } from '../components/ReviewOutputItemList';
import { SendTransactionButton } from '../components/SendTransactionButton';

export const SendReviewScreen = ({
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendReview>) => {
    const { accountKey } = route.params;
    const dispatch = useDispatch();

    const handleCancel = () => {
        dispatch(cancelSignSendFormTransactionThunk());
    };

    return (
        <Screen
            subheader={
                <ScreenSubHeader
                    content="Send review screen"
                    leftIcon={
                        <IconButton
                            iconName="chevronLeft"
                            size="medium"
                            colorScheme="tertiaryElevation0"
                            onPress={handleCancel}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        />
                    }
                />
            }
        >
            <VStack justifyContent="center" alignItems="center">
                <ReviewOutputItemList accountKey={accountKey} />
                <SendTransactionButton accountKey={accountKey} />
            </VStack>
        </Screen>
    );
};
