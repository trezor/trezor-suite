import { goto } from '@suite/router';
import { Row, Text } from '@trezor/components';

import {
    type NavigationItem,
    PageHeader,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch } from 'src/hooks/suite';

import { useSparkWallet } from './useSparkWallet';

export const SparkHeader = () => {
    const dispatch = useDispatch();
    const { selectedAccount } = useSparkWallet();

    const items: NavigationItem[] = [
        {
            id: 'spark-index',
            title: 'History',
            callback: () => dispatch(goto({ routeName: 'spark-index' })),
            'data-testid': '@spark/menu/history',
        },
        {
            id: 'spark-receive',
            title: 'Receive',
            callback: () => dispatch(goto({ routeName: 'spark-receive' })),
            'data-testid': '@spark/menu/receive',
        },
        {
            id: 'spark-send',
            title: 'Send',
            callback: () => dispatch(goto({ routeName: 'spark-send' })),
            'data-testid': '@spark/menu/send',
        },
    ];

    return (
        <>
            <PageHeader>
                <Row justifyContent="space-between" width="100%" alignItems="center">
                    <Text typographyStyle="headline-sm">Spark</Text>
                    <Text color="contentSecondary">
                        {selectedAccount
                            ? `Account #${selectedAccount.accountNumber + 1}`
                            : 'No Spark account selected'}
                    </Text>
                </Row>
            </PageHeader>
            <SubpageNavigation data-testid="@spark/menu" items={items} />
        </>
    );
};
