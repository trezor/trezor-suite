import { ReactNode } from 'react';

import styled, { keyframes } from 'styled-components';

import { spacings } from '@trezor/theme';

import { Row } from '../Flex/Flex';
import { Icon, IconName, IconVariant } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

const slideDown = keyframes`
    from {
        opacity: 0;
        transform: translateY(-2px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const Container = styled.div`
    animation: ${slideDown} 0.18s ease-in-out forwards;
`;

type BottomTextProps = {
    hasError?: boolean;
    isDisabled?: boolean;
    iconComponent?: ReactNode;
    iconName?: IconName;
    children: ReactNode;
    'data-testid'?: string;
};

export const BottomText = ({
    hasError,
    isDisabled,
    iconComponent,
    iconName,
    children,
    'data-testid': dataTestId,
}: BottomTextProps) => {
    // eslint-disable-next-line no-nested-ternary
    const variant = isDisabled ? 'disabled' : hasError ? 'destructive' : 'tertiary';
    const textIntent = hasError ? 'critical' : 'neutral';
    const textPriority = hasError ? 'primary' : 'secondary';

    return (
        <Container>
            <Row gap={spacings.xxs}>
                {iconComponent ??
                    (iconName && (
                        <Icon name={iconName} size="medium" variant={variant as IconVariant} />
                    ))}
                <Text
                    data-testid={dataTestId}
                    intent={textIntent}
                    priority={textPriority}
                    isDisabled={isDisabled}
                    typographyStyle="body-sm"
                    as="div"
                    flex="auto"
                >
                    {children}
                </Text>
            </Row>
        </Container>
    );
};
