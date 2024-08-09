import { useSelector } from 'react-redux';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { SendFeesForm } from '../components/SendFeesForm';
import { SendFormScreenWrapper } from '../components/SendFormScreenWrapper';
import { RecipientsSummary } from '../components/RecipientsSummary';

export const SendFeesScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendFees>) => {
    const { accountKey, feeLevels } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return;

    return (
        <SendFormScreenWrapper accountKey={accountKey}>
            <VStack spacing="extraLarge" flex={1}>
                <RecipientsSummary accountKey={accountKey} />
                <SendFeesForm accountKey={accountKey} feeLevels={feeLevels} />
            </VStack>
        </SendFormScreenWrapper>
    );
};
