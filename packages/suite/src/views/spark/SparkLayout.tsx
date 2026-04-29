import { Button, Card, Column, Text } from '@trezor/components';

import { useLayout } from 'src/hooks/suite';

import { SparkHeader } from './SparkHeader';
import { useSparkWallet } from './useSparkWallet';

type SparkLayoutProps = {
    children?: React.ReactNode;
};

export const SparkLayout = ({ children }: SparkLayoutProps) => {
    const { addAccount, device, isEnabled, walletDescriptor, accounts } = useSparkWallet();

    useLayout('Spark', <SparkHeader />);

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
                        Create the first mocked Spark account for this wallet descriptor.
                    </Text>
                    <Button width="fit-content" onClick={addAccount}>
                        Add Spark account
                    </Button>
                </Column>
            </Card>
        );
    }

    return <Column gap={16}>{children}</Column>;
};
