import { ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import type { ExtendedMessageDescriptor } from 'src/types/suite';
import type { NotificationRendererProps } from 'src/components/suite';

const Header = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    margin-top: 1px;
`;

const Body = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-top: 1px;
`;

type ConditionalActionRendererProps = NotificationRendererProps & {
    header: ReactNode;
    body: ReactNode;
    icon?: JSX.Element;
    actionLabel: ExtendedMessageDescriptor['id'];
    actionAllowed: boolean;
    onAction: () => void;
    onCancel: () => void;
};

export const ConditionalActionRenderer = ({
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
