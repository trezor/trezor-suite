import { selectSelectedDevice } from '@suite-common/device';
import {
    selectIsSparkEnabled,
    selectSelectedSparkAccount,
    selectSparkAccountsByWalletDescriptor,
    selectSparkWalletByAccountNumber,
} from '@suite-common/spark';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Button, Card, Column, Text } from '@trezor/components';

import { useLayout, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

import { SparkHeader } from './SparkHeader';

type SparkLayoutProps = {
    children?: React.ReactNode;
};

export const SparkLayout = ({ children }: SparkLayoutProps) => {
    const { spark } = useSuiteServices();
    const device = useSelector(selectSelectedDevice);
    const isEnabled = useSelector(selectIsSparkEnabled);
    const deviceStaticSessionId = device?.state?.staticSessionId;
    const walletDescriptor = deviceStaticSessionId
        ? parseDeviceStaticSessionId(deviceStaticSessionId).walletDescriptor
        : null;
    const accounts = useSelector(state =>
        walletDescriptor ? selectSparkAccountsByWalletDescriptor(state, walletDescriptor) : [],
    );
    const selectedAccount = useSelector(state =>
        walletDescriptor ? selectSelectedSparkAccount(state, walletDescriptor) : undefined,
    );
    const wallet = useSelector(state =>
        walletDescriptor && selectedAccount
            ? selectSparkWalletByAccountNumber(state, {
                  accountNumber: selectedAccount.accountNumber,
                  walletDescriptor,
              })
            : undefined,
    );

    useLayout('Spark', <SparkHeader />);

    const addAccount = () => {
        if (!walletDescriptor || !deviceStaticSessionId) {
            return;
        }

        const nextAccountNumber =
            accounts.length > 0
                ? Math.max(...accounts.map(account => account.accountNumber)) + 1
                : 0;

        void spark.addSparkAccount({
            accountNumber: nextAccountNumber,
            deviceStaticSessionId,
            walletDescriptor,
        });
    };

    const reloadSelectedAccount = () => {
        if (!deviceStaticSessionId || !walletDescriptor || !selectedAccount) {
            return;
        }

        void spark.syncSparkWallet({
            accountNumber: selectedAccount.accountNumber,
            deviceStaticSessionId,
            setLoading: false,
            walletDescriptor,
        });
    };

    if (!isEnabled) {
        return (
            <Card>
                <Column gap={12}>
                    <Text typographyStyle="body-md-strong">Spark is disabled</Text>
                    <Text color="contentSecondary">
                        Enable Spark in Settings, then add a Spark account from the wallet sidebar.
                    </Text>
                </Column>
            </Card>
        );
    }

    if (!device || !walletDescriptor) {
        return (
            <Card>
                <Column gap={12}>
                    <Text typographyStyle="body-md-strong">Select a wallet first</Text>
                    <Text color="contentSecondary">
                        Spark follows the selected wallet descriptor, similar to Suite Sync.
                    </Text>
                </Column>
            </Card>
        );
    }

    if (accounts.length === 0) {
        return (
            <Card>
                <Column gap={12}>
                    <Text typographyStyle="body-md-strong">No Spark account yet</Text>
                    <Text color="contentSecondary">
                        Create the first Spark account for this wallet descriptor.
                    </Text>
                    <Button width="fit-content" onClick={addAccount}>
                        Add Spark account
                    </Button>
                </Column>
            </Card>
        );
    }

    if (selectedAccount && (!wallet || wallet.status === 'idle' || wallet.status === 'loading')) {
        return (
            <Card>
                <Column gap={12}>
                    <Text typographyStyle="body-md-strong">Loading Spark wallet</Text>
                    <Text color="contentSecondary">
                        Syncing Spark balance and recent activity for the selected account.
                    </Text>
                </Column>
            </Card>
        );
    }

    if (selectedAccount && wallet?.status === 'error') {
        return (
            <Card>
                <Column gap={12}>
                    <Text typographyStyle="body-md-strong">Spark wallet unavailable</Text>
                    <Text color="contentSecondary">{wallet.error ?? 'Unknown Spark error.'}</Text>
                    <Button width="fit-content" onClick={reloadSelectedAccount}>
                        Retry
                    </Button>
                </Column>
            </Card>
        );
    }

    return <Column gap={16}>{children}</Column>;
};
