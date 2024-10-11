import { ComponentProps } from 'react';

import {
    authConfirm,
    authorizeDeviceThunk,
    restartDiscoveryThunk as restartDiscovery,
} from '@suite-common/wallet-core';
import { getNetwork, NetworkType } from '@suite-common/wallet-config';
import { Button, H3, Image, IconName, Column, Row, Paragraph } from '@trezor/components';
import { Discovery } from '@suite-common/wallet-types';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { DiscoveryStatusType } from 'src/types/wallet';
import { TranslationKey } from 'src/components/suite/Translation';

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
        <Column gap={spacings.xxs} data-testid={`@exception/${dataTestBase}`}>
            <Image image="UNI_ERROR" />
            <H3 margin={{ top: spacings.md }}>
                <Translation id={title} />
            </H3>
            {description && (
                <Paragraph variant="tertiary" typographyStyle="hint">
                    {typeof description === 'string' ? (
                        <Translation id={description} />
                    ) : (
                        description
                    )}
                </Paragraph>
            )}
            <Row gap={spacings.sm} margin={{ top: spacings.md }}>
                {actions.map(a => (
                    <Button
                        key={a.label || 'TR_RETRY'}
                        variant={a.variant || 'primary'}
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

const discoveryFailedMessage = (discovery?: Discovery) => {
    if (!discovery) return '';
    if (discovery.error) return <div>{discovery.error}</div>;

    // Group all failed networks into array of errors.
    const networkError: string[] = [];
    const details = discovery.failed.reduce((value, account) => {
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
    discovery?: Discovery;
};

export const PortfolioCardException = ({ exception, discovery }: PortfolioCardExceptionProps) => {
    const dispatch = useDispatch();

    switch (exception.type) {
        case 'auth-failed':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_AUTH_ERROR"
                    description="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC"
                    cta={{
                        action: () => dispatch(authorizeDeviceThunk()),
                        icon: 'refresh',
                    }}
                    dataTestBase={exception.type}
                />
            );
        case 'auth-confirm-failed':
            return (
                <Container
                    title="TR_AUTH_CONFIRM_FAILED_TITLE"
                    cta={{
                        action: () => dispatch(authConfirm()),
                        icon: 'refresh',
                    }}
                    dataTestBase={exception.type}
                />
            );
        case 'discovery-empty':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY"
                    description="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC"
                    cta={[
                        {
                            action: () => dispatch(goto('settings-coins')),
                            icon: 'settings',
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
                    cta={{ action: () => dispatch(restartDiscovery()), icon: 'refresh' }}
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
                            dispatch(restartDiscovery());
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
