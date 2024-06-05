import { useSelector } from 'react-redux';

import {
    GoBackIcon,
    Screen,
    ScreenSubHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { CryptoAmountFormatter } from '@suite-native/formatters';

import { SendForm } from '../components/SendForm';

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
            subheader={<ScreenSubHeader content="Send form screen" leftIcon={<GoBackIcon />} />}
        >
            <VStack>
                <VStack justifyContent="center" alignItems="center">
                    <Text textAlign="center">Send form prototype of account:</Text>
                    <Text textAlign="center">{account.accountLabel}</Text>
                    <HStack>
                        <Text textAlign="center">account balance:</Text>
                        <CryptoAmountFormatter
                            variant="body"
                            color="textDefault"
                            value={account.availableBalance}
                            network={account.symbol}
                            isBalance={false}
                        />
                    </HStack>
                </VStack>
                <SendForm accountKey={accountKey} />
            </VStack>
        </Screen>
    );
};
