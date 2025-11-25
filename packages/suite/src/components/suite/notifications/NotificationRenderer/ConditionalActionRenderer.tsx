import { JSX, ReactNode } from 'react';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { Paragraph } from '@trezor/components';

import type { NotificationRendererProps } from 'src/components/suite';

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
                header: (
                    <Paragraph typographyStyle="body" margin={{ top: 2 }} variant="tertiary">
                        {header}
                    </Paragraph>
                ),
                body: (
                    <Paragraph typographyStyle="body" margin={{ top: 2 }}>
                        {body}
                    </Paragraph>
                ),
            }}
            action={action}
            onCancel={onCancel}
        />
    );
};
