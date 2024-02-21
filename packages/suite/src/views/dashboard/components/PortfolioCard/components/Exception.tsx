import { ComponentProps } from 'react';

import styled from 'styled-components';

import {
    authConfirm,
    authorizeDevice,
    restartDiscoveryThunk as restartDiscovery,
} from '@suite-common/wallet-core';
import * as accountUtils from '@suite-common/wallet-utils';
import { variables, Button, IconProps, H3, Image } from '@trezor/components';
import { Discovery } from '@suite-common/wallet-types';

import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { goto } from 'src/actions/suite/routerActions';
import { DiscoveryStatusType } from 'src/types/wallet';
import { TranslationKey } from 'src/components/suite/Translation';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 20px;
    width: 100%;
`;

const Title = styled(H3)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    text-align: center;
`;

const StyledImage = styled(props => <Image {...props} />)`
    margin: 24px 0;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-around;
    width: 100%;
    margin-top: 24px;
`;

interface CTA {
    label?: TranslationKey;
    variant?: ComponentProps<typeof Button>['variant'];
    action: () => void;
    icon?: IconProps['icon'];
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
        <Wrapper data-test-id={`@exception/${dataTestBase}`}>
            <StyledImage image="UNI_ERROR" />
            <Title>
                <Translation id={title} />
            </Title>
            {description && (
                <Description>
                    {typeof description === 'string' ? (
                        <Translation id={description} />
                    ) : (
                        description
                    )}
                </Description>
            )}
            <Actions>
                {actions.map(a => (
                    <Button
                        key={a.label || 'TR_RETRY'}
                        variant={a.variant || 'primary'}
                        icon={a.icon || 'PLUS'}
                        isLoading={isLocked()}
                        onClick={a.action}
                        data-test-id={`@exception/${dataTestBase}/${a.variant || 'primary'}-button`}
                    >
                        <Translation id={a.label || 'TR_RETRY'} />
                    </Button>
                ))}
            </Actions>
        </Wrapper>
    );
};

interface ExceptionProps {
    exception: Extract<DiscoveryStatusType, { status: 'exception' }>;
    discovery?: Discovery;
}

const discoveryFailedMessage = (discovery?: Discovery) => {
    if (!discovery) return '';
    if (discovery.error) return <div>{discovery.error}</div>;
    // group all failed networks into array of errors
    const networkError: string[] = [];
    const details = discovery.failed.reduce((value, account) => {
        const n = accountUtils.getNetwork(account.symbol)!;
        if (networkError.includes(account.symbol)) return value;
        networkError.push(account.symbol);

        return value.concat(
            <div key={account.symbol}>
                {n.name}: {account.error}
            </div>,
        );
    }, [] as JSX.Element[]);

    return <>{details}</>;
};

export const Exception = ({ exception, discovery }: ExceptionProps) => {
    const dispatch = useDispatch();

    switch (exception.type) {
        case 'auth-failed':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_AUTH_ERROR"
                    description="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC"
                    cta={{
                        action: () => dispatch(authorizeDevice()),
                    }}
                    dataTestBase={exception.type}
                />
            );
        case 'auth-confirm-failed':
            return (
                <Container
                    title="TR_AUTH_CONFIRM_FAILED_TITLE"
                    cta={{ action: () => dispatch(authConfirm()) }}
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
                            icon: 'SETTINGS',
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
                    cta={{ action: () => dispatch(restartDiscovery()), icon: 'REFRESH' }}
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
