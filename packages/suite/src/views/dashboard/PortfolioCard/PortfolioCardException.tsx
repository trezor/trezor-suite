import { ComponentProps } from 'react';

import { NetworkType, getNetwork } from '@suite-common/wallet-config';
import { restartDiscoveryThunk } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';
import { Button, Column, H3, IconCircle, IconName, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { TranslationKey } from 'src/components/suite/Translation';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { DiscoveryStatusType } from 'src/types/wallet';

interface CTA {
    label?: TranslationKey;
    variant?: ComponentProps<typeof Button>['variant'];
    action: () => void;
    icon?: IconName;
}

interface ContainerProps {
    title: TranslationKey;
    description?: TranslationKey | JSX.Element;
    cta: CTA | CTA[];
    dataTestBase: string;
}

// Common wrapper for all views
const Container = ({ title, description, cta, dataTestBase }: ContainerProps) => {
    const { isLocked } = useDevice();
    const actions = Array.isArray(cta) ? cta : [cta];

    return (
        <Column gap={spacings.xxs} data-testid={`@exception/${dataTestBase}`} alignItems="center">
            <IconCircle name="warning" size={90} variant="warning" />
            <H3 margin={{ top: spacings.md }}>
                <Translation id={title} />
            </H3>
            {description && (
                <Text variant="tertiary" typographyStyle="hint">
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
                        variant={a.variant || 'warning'}
                        icon={a.icon || 'plus'}
                        isLoading={isLocked()}
                        onClick={a.action}
                        data-testid={`@exception/${dataTestBase}/${a.variant || 'primary'}-button`}
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

const discoveryFailedMessage = (discovery?: DiscoveryStatus) => {
    if (!discovery || discovery.status !== 'failed') return '';
    if (discovery.error) return <div>{discovery.error}</div>;

    // Group all failed networks into array of errors.
    const networkError: string[] = [];

    // todo: use accounts for this
    const details = (discovery.failed ?? []).reduce((value, account) => {
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
};

export const PortfolioCardException = ({ exception, discovery }: PortfolioCardExceptionProps) => {
    const dispatch = useDispatch();

    switch (exception.type) {
        case 'discovery-empty':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY"
                    description="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC"
                    cta={[
                        {
                            action: () => dispatch(goto('settings-coins')),
                            icon: 'gear',
                            label: 'TR_COIN_SETTINGS',
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
                            values={{ details: discoveryFailedMessage(discovery) }}
                        />
                    }
                    cta={{ action: () => dispatch(restartDiscoveryThunk()), icon: 'repeat' }}
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
                            values={{ details: discoveryFailedMessage(discovery) }}
                        />
                    }
                    cta={{
                        action: async () => {
                            // enable passphrase
                            const result = await dispatch(applySettings({ use_passphrase: true }));
                            if (!result || !result.success) return;
                            // restart discovery
                            dispatch(restartDiscoveryThunk());
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
