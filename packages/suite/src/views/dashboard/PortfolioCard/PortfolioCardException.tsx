import { type ComponentProps, type JSX } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { openModal } from '@suite/modal';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkType, getNetwork } from '@suite-common/wallet-config';
import { startOrRestartDiscoveryThunk } from '@suite-common/wallet-core';
import { type DiscoveryStatus, type FailedAccount } from '@suite-common/wallet-types';
import {
    Button,
    Column,
    H3,
    IconCircle,
    type IconComponent,
    Illustration,
    Paragraph,
    Row,
} from '@trezor/components';
import { PlusIcon, RepeatIcon, WarningIcon } from '@trezor/icons';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { type DiscoveryStatusType } from 'src/types/wallet';

interface CTA {
    label?: TranslationKey;
    intent?: ComponentProps<typeof Button>['intent'];
    action: () => void;
    icon?: IconComponent;
    isDisabled?: boolean;
    size?: ComponentProps<typeof Button>['size'];
}

interface ContainerProps {
    title: TranslationKey;
    description?: TranslationKey | JSX.Element;
    cta: CTA | CTA[];
    dataTestBase: string;
    image?: React.ReactNode;
}

// Common wrapper for all views
const Container = ({ title, description, cta, dataTestBase, image }: ContainerProps) => {
    const { isLocked } = useDevice();
    const actions = Array.isArray(cta) ? cta : [cta];

    return (
        <Column gap={4} data-testid={`@exception/${dataTestBase}`} alignItems="center">
            {image ? image : <IconCircle icon={WarningIcon} size={96} intent="warning" />}
            <H3 data-testid={`@exception/${dataTestBase}/header`} margin={{ top: 16 }}>
                <Translation id={title} />
            </H3>
            {description && (
                <Paragraph
                    data-testid={`@exception/${dataTestBase}/description`}
                    intent="neutral"
                    priority="secondary"
                    typographyStyle="body-sm"
                    maxWidth={500}
                    align="center"
                >
                    {typeof description === 'string' ? (
                        <Translation id={description} />
                    ) : (
                        description
                    )}
                </Paragraph>
            )}
            <Row gap={12} margin={{ top: 16 }}>
                {actions.map(a => (
                    <Button
                        key={a.label || 'TR_RETRY'}
                        intent={a.intent || 'warning'}
                        iconLeft={a.icon}
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
    if (discovery?.status !== 'failed') return '';
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
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    switch (exception.type) {
        case 'discovery-empty':
            return (
                <Container
                    image={<Illustration name="networks" width={224} />}
                    title="TR_YOUR_WALLET_IS_READY_WHAT"
                    description="TR_DASHBOARD_ACTIVATE_ASSETS_DESC"
                    cta={[
                        {
                            action: () => {
                                analytics.report({
                                    type: events.dashboardActivateAssetsModalEvent.name,
                                    payload: { source: 'empty-wallet' },
                                });
                                dispatch(openModal({ type: 'activate-assets' }));
                            },
                            isDisabled: false,
                            intent: 'brand',
                            label: 'TR_DASHBOARD_GET_STARTED',
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
                    cta={{
                        action: () => dispatch(startOrRestartDiscoveryThunk()),
                        icon: RepeatIcon,
                    }}
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
                            if (!result?.success) return;
                            // restart discovery
                            dispatch(startOrRestartDiscoveryThunk());
                        },
                        label: 'TR_ACCOUNT_ENABLE_PASSPHRASE',
                        icon: PlusIcon,
                    }}
                    dataTestBase={exception.type}
                />
            );
        default:
            return null;
    }
};
