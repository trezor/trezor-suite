import { useSelector } from 'react-redux';

import {
    GoBackIcon,
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { Box, Text, VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

export const SendFormScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendForm>) => {
    const { accountKey } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return;

    // TODO: move text content to @suite-native/intl package when is copy ready
    return (
        <Screen
            subheader={<ScreenSubHeader content={'Send form screen'} leftIcon={<GoBackIcon />} />}
        >
            <VStack flex={1} justifyContent="center" alignItems="center">
                <Box>
                    <Text textAlign="center">Send Form Screen mockup of account:</Text>
                    <Text textAlign="center">{account.accountLabel}</Text>
                </Box>
                <Text textAlign="center">
                    This screen will soon contain a form that allows users to send crypto from
                    Trezor Suite Lite. Fingers crossed.
                </Text>
            </VStack>
        </Screen>
    );
};
