import { ReactNode } from 'react';

import styled, { keyframes } from 'styled-components';

import { spacings } from '@trezor/theme';

import { IconName, Icon, IconVariant } from '../Icon/Icon';
import { InputState } from './types';
import { Row } from '../Flex/Flex';
import { Text, TextVariant } from '../typography/Text/Text';
import { UIVariant } from '../../config/types';

export const mapInputStateToUIVariant = (inputState: InputState): UIVariant => {
    const variantMap: Record<InputState, UIVariant> = {
        error: 'destructive',
        primary: 'primary',
        warning: 'warning',
        default: 'tertiary',
    };

    return variantMap[inputState];
};

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
    inputState?: InputState;
    isDisabled?: boolean;
    iconComponent?: ReactNode;
    iconName?: IconName;
    children: ReactNode;
};

export const BottomText = ({
    inputState = 'default',
    isDisabled,
    iconComponent,
    iconName,
    children,
}: BottomTextProps) => {
    const variant = isDisabled ? 'disabled' : mapInputStateToUIVariant(inputState);

    return (
        <Container>
            <Row gap={spacings.xxs}>
                {iconComponent ??
                    (iconName && (
                        <Icon name={iconName} size="medium" variant={variant as IconVariant} />
                    ))}
                <Text variant={variant as TextVariant} typographyStyle="hint" as="div">
                    {children}
                </Text>
            </Row>
        </Container>
    );
};
