import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { Badge, HStack, type SubTabItem, SubTabs, VStack } from '@suite-native/atoms';
import {
    type RootStackParamList,
    type RootStackRoutes,
    Screen,
    ScreenHeader,
    type StackProps,
} from '@suite-native/navigation';
import { SignMessageCard } from '@suite-native/sign-verify';

import { AccountDetailScreenHeaderContent } from '../components/AccountDetailScreenHeader';

type Tab = 'sign' | 'verify';

export const AccountSignAndVerifyScreen = ({
    route,
}: StackProps<RootStackParamList, RootStackRoutes.AccountSignAndVerify>) => {
    const { accountKey } = route.params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const tabs = useMemo(() => {
        const items: SubTabItem<Tab>[] = [
            { value: 'sign', label: 'Sign' },
            { value: 'verify', label: 'Verify' },
        ];

        return items;
    }, []);
    const [activeTab, setActiveTab] = useState<Tab>('sign');

    if (!account) {
        return null;
    }

    return (
        <Screen
            header={
                <ScreenHeader
                    closeActionType="close"
                    customContent={<AccountDetailScreenHeaderContent account={account} />}
                />
            }
        >
            <VStack spacing="sp16">
                <HStack alignItems="center" justifyContent="space-between">
                    <SubTabs items={tabs} onChange={setActiveTab} value={activeTab} />
                    <Badge icon="check" label="Message signed" intent="brand" />
                </HStack>
                <SignMessageCard account={account} />
            </VStack>
        </Screen>
    );
};
