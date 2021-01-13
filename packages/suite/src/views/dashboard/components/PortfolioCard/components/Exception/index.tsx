import React from 'react';
import styled from 'styled-components';
import { variables, Button, IconProps } from '@trezor/components';
import { Image, Translation } from '@suite-components';
import { useDevice } from '@suite-hooks';
import { useDispatch } from 'react-redux';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import * as accountUtils from '@wallet-utils/accountUtils';
import { Dispatch } from '@suite-types';
import { Discovery, DiscoveryStatus } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding: 20px;
    width: 100%;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.H2};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-align: center;
`;

const StyledImage = styled(props => <Image {...props} />)`
    width: 80px;
    height: 80px;
    margin: 20px 0px;
`;

const Actions = styled.div`
    display: flex;
    justify-content: space-around;
    width: 100%;
`;

interface CTA {
    label?: React.ComponentProps<typeof Translation>['id'];
    variant?: React.ComponentProps<typeof Button>['variant'];
    action: () => void;
    icon?: IconProps['icon'];
    //  testId?: string;
}

interface ContainerProps {
    title: React.ComponentProps<typeof Translation>['id'];
    description: React.ComponentProps<typeof Translation>['id'] | JSX.Element;
    cta: CTA | CTA[];
    dataTestBase: string;
}

// Common wrapper for all views
const Container = ({ title, description, cta, dataTestBase }: ContainerProps) => {
    const { isLocked } = useDevice();
    const actions = Array.isArray(cta) ? cta : [cta];
    return (
        <Wrapper data-test={`@exception/${dataTestBase}`}>
            <Title>
                {' '}
                <Translation id={title} />
            </Title>
            <Description>
                {typeof description === 'string' ? <Translation id={description} /> : description}
            </Description>
            <StyledImage image="UNI_ERROR" />
            <Actions>
                {actions.map(a => (
                    <Button
                        key={a.label || 'TR_RETRY'}
                        variant={a.variant || 'primary'}
                        icon={a.icon || 'PLUS'}
                        isLoading={isLocked()}
                        onClick={a.action}
                        data-test={`@exception/${dataTestBase}/${a.variant || 'primary'}-button`}
                    >
                        <Translation id={a.label || 'TR_RETRY'} />
                    </Button>
                ))}
            </Actions>
        </Wrapper>
    );
};

interface Props {
    exception: Extract<DiscoveryStatus, { status: 'exception' }>;
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

const Exception = ({ exception, discovery }: Props) => {
    const dispatch = useDispatch<Dispatch>();
    const { device } = useDevice();
    switch (exception.type) {
        case 'auth-failed':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_AUTH_ERROR"
                    description="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC"
                    cta={{ action: () => dispatch(suiteActions.authorizeDevice()) }}
                    dataTestBase={exception.type}
                />
            );
        case 'auth-confirm-failed':
            return (
                <Container
                    title="TR_AUTH_CONFIRM_FAILED_TITLE"
                    description="TR_AUTH_CONFIRM_FAILED_DESC"
                    cta={{
                        action: () => dispatch(suiteActions.authConfirm()),
                        // testId: '@passphrase-mismatch/retry-button',
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
                            action: () => dispatch(routerActions.goto('settings-coins')),
                            variant: 'secondary',
                            icon: 'SETTINGS',
                            label: 'TR_COIN_SETTINGS',
                        },
                        {
                            action: () =>
                                dispatch(
                                    modalActions.openModal({
                                        type: 'add-account',
                                        device: device!,
                                    }),
                                ),
                            label: 'TR_ADD_ACCOUNT',
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
                    cta={{ action: () => dispatch(discoveryActions.restart()) }}
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
                            const result = await dispatch(
                                // eslint-disable-next-line @typescript-eslint/naming-convention
                                deviceSettingsActions.applySettings({ use_passphrase: true }),
                            );
                            if (!result || !result.success) return;
                            // restart discovery
                            dispatch(discoveryActions.restart());
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

export default Exception;
