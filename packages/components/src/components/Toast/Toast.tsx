import { type ReactNode } from 'react';

import styled from 'styled-components';

import { borders, spacings, spacingsPx } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { type ToastAction, type ToastIntent } from './types';
import { mapToastIntentToIcon, mapToastVariantToColor, normalizeToastActions } from './utils';
import { Column, Row } from '../Flex/Flex';
import { Icon, type IconName } from '../Icon/Icon';
import { Button } from '../buttons/Button/Button';
import { IconButton } from '../buttons/IconButton/IconButton';
import { Text } from '../typography/Text/Text';

const Container = styled.div<{ $variant: ToastIntent }>`
    display: flex;
    align-items: center;
    min-height: 3.25rem;

    padding-inline: ${spacingsPx.md};
    padding-block: ${spacingsPx.xs};

    font-size: 1rem;
    color: ${({ theme }) => theme.contentPrimary};

    overflow-wrap: anywhere;
    word-break: normal;

    border-radius: ${borders.radii.xs};
    position: relative;

    background: ${({ theme }) => hexToRgba(theme.legacyBackgroundNeutralBoldInverted, 0.5)};
    backdrop-filter: blur(12px);

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        border: 1px solid ${({ theme }) => hexToRgba(theme.legacyBackgroundNeutralBold, 0.1)};
    }

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-left: ${spacingsPx.xxs} solid
            ${({ theme, $variant }) => theme[mapToastVariantToColor($variant)]};
        border-radius: inherit;
    }
`;

export type ToastProps = {
    icon?: IconName;
    content: ReactNode;
    intent: ToastIntent;
    actions?: ToastAction[];
    dataTestId?: string;
    dismissible?: boolean;
    onDismiss?: () => void;
};

export const Toast = ({
    icon,
    content,
    intent,
    actions,
    dismissible = true,
    dataTestId,
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
        >
            {action.label}
        </Button>
    );

    return (
        <Container data-testid={dataTestBase} $variant={intent}>
            <Row gap={spacings.sm} justifyContent="space-between" flex="1">
                {showIcon && (
                    <Icon
                        name={icon ?? mapToastIntentToIcon(intent)}
                        color={mapToastVariantToColor(intent)}
                    />
                )}

                <Column gap={spacings.xs} flex="1">
                    {typeof content === 'string' || typeof content === 'number' ? (
                        <Text typographyStyle="body-md-strong">{content}</Text>
                    ) : (
                        content
                    )}

                    <Row gap={spacings.xs}>
                        {bottomActions.map((action, index) => renderActionButton(action, index))}
                    </Row>
                </Column>

                <Row gap={spacings.xs}>
                    {rightActions.map((action, index) => renderActionButton(action, index))}
                </Row>

                {dismissible && (
                    <IconButton
                        icon="x"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={onDismiss}
                        data-testid={`${dataTestBase}/close`}
                        aria-label="Close toast"
                    />
                )}
            </Row>
        </Container>
    );
};
