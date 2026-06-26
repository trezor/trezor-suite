import { type ReactNode } from 'react';

import { XIcon } from '@trezor/icons';

import { type ToastAction, type ToastIntent } from './types';
import {
    mapToastIntentToBackgroundColor,
    mapToastIntentToBorderColor,
    mapToastIntentToIcon,
    normalizeToastActions,
} from './utils';
import { Box } from '../Box/Box';
import { Column, Row } from '../Flex/Flex';
import { Icon, type IconComponent } from '../Icon/Icon';
import { Button } from '../buttons/Button/Button';
import { IconButton } from '../buttons/IconButton/IconButton';
import { Text } from '../typography/Text/Text';

export type ToastProps = {
    icon?: IconComponent;
    content: ReactNode;
    intent: ToastIntent;
    actions?: ToastAction[];
    dataTestId?: string;
    dismissible?: boolean;
    dismissTooltip?: ReactNode;
    onDismiss?: () => void;
};

export const Toast = ({
    icon,
    content,
    intent,
    actions,
    dismissible = true,
    dataTestId,
    dismissTooltip,
    onDismiss,
}: ToastProps) => {
    const dataTestBase = `@toast/${dataTestId ?? intent}`;
    const showIcon = intent !== 'neutral' || icon != null;

    const { bottomActions, rightActions } = normalizeToastActions(actions, intent);

    const renderActionButton = (action: ToastAction, index: number) => (
        <Button
            key={`${action.label}-${action.intent ?? ''}-${index}`}
            intent={action.intent}
            priority={action.priority}
            onClick={action.onClick}
            size="small"
            isInverse={intent === 'neutral'}
        >
            {action.label}
        </Button>
    );

    return (
        <div data-testid={dataTestBase} data-toast-intent={intent}>
            <Box
                borderRadius={8}
                backgroundColor={mapToastIntentToBackgroundColor(intent)}
                shadow="surfaceShadowModeless"
                borderWidth={1}
                borderColor={mapToastIntentToBorderColor(intent)}
                padding={{ horizontal: 16, vertical: 12 }}
            >
                <Row gap={16} justifyContent="space-between" width="100%">
                    {showIcon && (
                        <Icon
                            size={20}
                            as={icon ?? mapToastIntentToIcon(intent)}
                            intent={intent}
                            isInverse={intent === 'neutral'}
                        />
                    )}

                    <Column gap={8} flex="1">
                        <Text
                            overflowWrap="anywhere"
                            wordBreak="normal"
                            intent={intent}
                            priority="primary"
                            isInverse={intent === 'neutral'}
                            typographyStyle="body-sm"
                            as="div"
                        >
                            {content}
                        </Text>

                        <Row gap={8}>
                            {bottomActions.map((action, index) =>
                                renderActionButton(action, index),
                            )}
                        </Row>
                    </Column>

                    <Row gap={8}>
                        {rightActions.map((action, index) => renderActionButton(action, index))}
                        {dismissible && (
                            <IconButton
                                icon={XIcon}
                                size="small"
                                intent={intent}
                                priority="secondary"
                                onClick={onDismiss}
                                data-testid={`${dataTestBase}/close`}
                                aria-label="Close toast"
                                isInverse={intent === 'neutral'}
                                tooltip={
                                    dismissTooltip
                                        ? { content: dismissTooltip }
                                        : { isActive: false }
                                }
                            />
                        )}
                    </Row>
                </Row>
            </Box>
        </div>
    );
};
