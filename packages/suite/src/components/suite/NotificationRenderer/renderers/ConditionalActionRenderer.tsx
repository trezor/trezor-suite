import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import type { ExtendedMessageDescriptor } from '@suite-types';
import type { NotificationRendererProps } from '../types';

const Header = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    margin-top: 1px;
`;

const Body = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 1px;
`;

type ConditionalActionRendererProps = NotificationRendererProps & {
    header: React.ReactNode;
    body: React.ReactNode;
    icon?: JSX.Element;
    actionLabel: ExtendedMessageDescriptor['id'];
    actionAllowed: boolean;
    onAction: () => void;
    onCancel: () => void;
};

const ConditionalActionRenderer = ({
    header,
    body,
    actionAllowed,
    actionLabel,
    onAction,
    onCancel,
    render: View,
    ...rest
}: ConditionalActionRendererProps) => {
    const action = actionAllowed
        ? ({
              onClick: onAction,
              label: actionLabel,
              position: 'bottom',
              variant: 'primary',
          } as const)
        : undefined;

    return (
        <View
            {...rest}
            variant="transparent"
            message="TOAST_COIN_SCHEME_PROTOCOL"
            messageValues={{
                header: <Header>{header}</Header>,
                body: <Body>{body}</Body>,
            }}
            action={action}
            onCancel={onCancel}
        />
    );
};

export default ConditionalActionRenderer;
