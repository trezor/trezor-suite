import { goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { selectSelectedSparkAccount } from '@suite-common/spark';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Row, Text } from '@trezor/components';

import {
    type NavigationItem,
    PageHeader,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const SparkHeader = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const walletDescriptor = deviceStaticSessionId
        ? parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor
        : null;
    const selectedAccount = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccount(state, walletDescriptor) : undefined,
    );

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
