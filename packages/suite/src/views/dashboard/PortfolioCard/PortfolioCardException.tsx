import { type ComponentProps, type JSX } from 'react';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { goto } from '@suite/router';
import { type NetworkType, getNetwork } from '@suite-common/wallet-config';
import { startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { type DiscoveryStatus, type FailedAccount } from '@suite-common/wallet-types';
import { Button, Column, H3, IconCircle, type IconName, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { useDispatch } from 'src/hooks/suite';
import { type DiscoveryStatusType } from 'src/types/wallet';

interface CTA {
    label?: TranslationKey;
    intent?: ComponentProps<typeof Button>['intent'];
    action: () => void;
    icon?: IconName;
    isDisabled?: boolean;
}

interface ContainerProps {
    title: TranslationKey;
    description?: TranslationKey | JSX.Element;
    cta: CTA | CTA[];
    dataTestBase: string;
    icon?: React.ReactNode;
}

// Common wrapper for all views
const Container = ({ title, description, cta, dataTestBase, icon }: ContainerProps) => {
    const { isLocked } = useDevice();
    const actions = Array.isArray(cta) ? cta : [cta];

    return (
        <Column gap={spacings.xxs} data-testid={`@exception/${dataTestBase}`} alignItems="center">
            {icon ? icon : <IconCircle name="warning" size={96} intent="warning" />}
            <H3 data-testid={`@exception/${dataTestBase}/header`} margin={{ top: spacings.md }}>
                <Translation id={title} />
            </H3>
            {description && (
                <Text
                    data-testid={`@exception/${dataTestBase}/description`}
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-sm"
                >
                    {typeof description === 'string' ? (
                        <Translation id={description} />
                    ) : (
                        description
                    )}
                </Text>
            )}
            <Row gap={spacings.sm} margin={{ top: spacings.md }}>
                {actions.map(a => (
                    <Button
                        key={a.label || 'TR_RETRY'}
                        intent={a.intent || 'warning'}
                        iconLeft={a.icon || 'plus'}
                        isLoading={a.isDisabled ?? isLocked()}
                        onClick={a.action}
                        data-testid={`@exception/${dataTestBase}/${a.intent || 'warning'}-button`}
                        size={a.size}
                    >
                        <Translation id={a.label || 'TR_RETRY'} />
                    </Button>
                ))}
            </Row>
        </Column>
    );
};

const getAccountError = (accountError: string, networkType: NetworkType) => {
    if (accountError === 'All backends are down') {
        return <Translation id="TR_CONNECTION_LOST" />;
    }

    if (networkType === 'ethereum' && accountError === 'Forbidden key path') {
        return <Translation id="TR_UPGRADE_FIRMWARE_TO_DISCOVER_ACCOUNT_ERROR" />;
    }

    return accountError;
};

const discoveryFailedMessage = (
    discovery: DiscoveryStatus | undefined,
    failed: FailedAccount[],
) => {
    if (!discovery || discovery.status !== 'failed') return '';
    if (discovery.error) return <div>{discovery.error}</div>;

    // Group all failed networks into array of errors.
    const networkError: string[] = [];

    const details = failed.reduce((value, account) => {
        const network = getNetwork(account.symbol);
        if (networkError.includes(account.symbol)) return value;
        networkError.push(account.symbol);

        const accountTypeDisplay =
            account.accountType !== 'normal' ? ` ${account.accountType}` : '';

        return value.concat(
            <div key={account.symbol}>
                {network.name}
                {accountTypeDisplay}: {getAccountError(account.error, network.networkType)}
            </div>,
        );
    }, [] as JSX.Element[]);

    return <>{details}</>;
};

type PortfolioCardExceptionProps = {
    exception: Extract<DiscoveryStatusType, { status: 'exception' }>;
    discovery?: DiscoveryStatus;
    failed: FailedAccount[];
};

export const PortfolioCardException = ({
    exception,
    discovery,
    failed,
}: PortfolioCardExceptionProps) => {
    const dispatch = useDispatch();

    switch (exception.type) {
        case 'discovery-empty':
            return (
                <Container
                    icon={<IconCircle name="coins" size={96} intent="brand" />}
                    title="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY"
                    description="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC"
                    cta={[
                        {
                            action: () => dispatch(goto({ routeName: 'settings-coins' })),
                            isDisabled: false,
                            intent: 'brand',
                            label: 'TR_COIN_SETTINGS',
                            size: 'large',
                        },
                    ]}
                    dataTestBase={exception.type}
                />
            );
        case 'discovery-failed':
            return (
                <Container
                    title="TR_DASHBOARD_DISCOVERY_ERROR"
                    description={
                        <Translation
                            id="TR_DASHBOARD_DISCOVERY_ERROR_PARTIAL_DESC"
                            values={{ details: discoveryFailedMessage(discovery, failed) }}
                        />
                    }
                    cta={{ action: () => dispatch(startOrRestartDiscoveryThunk()), icon: 'repeat' }}
                    dataTestBase={exception.type}
                />
            );
        case 'device-unavailable':
            return (
                <Container
                    title="TR_DASHBOARD_DISCOVERY_ERROR"
                    description={
                        <Translation
                            id="TR_ACCOUNT_PASSPHRASE_DISABLED"
                            values={{ details: discoveryFailedMessage(discovery, failed) }}
                        />
                    }
                    cta={{
                        action: async () => {
                            // enable passphrase
                            const result = await dispatch(applySettings({ use_passphrase: true }));
                            if (!result || !result.success) return;
                            // restart discovery
                            dispatch(startOrRestartDiscoveryThunk());
                        },
                        label: 'TR_ACCOUNT_ENABLE_PASSPHRASE',
                    }}
                    dataTestBase={exception.type}
                />
            );
        default:
            return null;
    }
};
