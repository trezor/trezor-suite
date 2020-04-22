import React from 'react';
import styled from 'styled-components';
import { colors, variables, Button, IconProps } from '@trezor/components';
import { Image, Translation } from '@suite-components';
import { useDeviceActionLocks, useDevice } from '@suite-hooks';
import { useDispatch } from 'react-redux';
import * as discoveryActions from '@wallet-actions/discoveryActions';
import * as suiteActions from '@suite-actions/suiteActions';
import * as modalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import * as accountUtils from '@wallet-utils/accountUtils';
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
    color: ${colors.BLACK0};
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.BLACK50};
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
}

interface ContainerProps {
    title: React.ComponentProps<typeof Translation>['id'];
    description: React.ComponentProps<typeof Translation>['id'] | JSX.Element;
    cta: CTA | CTA[];
}

// Common wrapper for all views
const Container = ({ title, description, cta }: ContainerProps) => {
    const [isEnabled] = useDeviceActionLocks();
    const actions = Array.isArray(cta) ? cta : [cta];
    return (
        <Wrapper>
            <Title>
                <Translation id={title} />
            </Title>
            <Description>
                {typeof description === 'string' ? <Translation id={description} /> : description}
            </Description>
            <StyledImage image="UNI_ERROR" />
            <Actions>
                {actions.map(a => (
                    <Button
                        key={a.label}
                        variant={a.variant || 'primary'}
                        icon={a.icon || 'PLUS'}
                        isLoading={!isEnabled}
                        onClick={a.action}
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

export default ({ exception, discovery }: Props) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    switch (exception.type) {
        case 'auth-failed':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_AUTH_ERROR"
                    description="TR_ACCOUNT_EXCEPTION_AUTH_ERROR_DESC"
                    cta={{ action: () => dispatch(suiteActions.authorizeDevice()) }}
                />
            );
        case 'auth-confirm-failed':
            return (
                <Container
                    title="TR_AUTH_CONFIRM_FAILED_TITLE"
                    description="TR_AUTH_CONFIRM_FAILED_DESC"
                    cta={{ action: () => dispatch(suiteActions.authConfirm()) }}
                />
            );
        case 'discovery-empty':
            return (
                <Container
                    title="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY"
                    description="TR_ACCOUNT_EXCEPTION_DISCOVERY_EMPTY_DESC"
                    cta={[
                        {
                            action: () => dispatch(routerActions.goto('settings-wallet')),
                            variant: 'secondary',
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
                />
            );
        default:
            return null;
    }
};
