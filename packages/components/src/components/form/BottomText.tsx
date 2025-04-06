import { ReactNode } from 'react';

import styled, { keyframes } from 'styled-components';

import { spacings } from '@trezor/theme';

import { InputState } from './types';
import { UIVariant } from '../../config/types';
import { Row } from '../Flex/Flex';
import { Icon, IconName, IconVariant } from '../Icon/Icon';
import { Text, TextVariant } from '../typography/Text/Text';

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
    'data-testid'?: string;
};

export const BottomText = ({
    inputState = 'default',
    isDisabled,
    iconComponent,
    iconName,
    children,
    'data-testid': dataTestId,
}: BottomTextProps) => {
    const variant = isDisabled ? 'disabled' : mapInputStateToUIVariant(inputState);

    return (
        <Container>
            <Row gap={spacings.xxs}>
                {iconComponent ??
                    (iconName && (
                        <Icon name={iconName} size="medium" variant={variant as IconVariant} />
                    ))}
                <Text
                    data-testid={dataTestId}
                    variant={variant as TextVariant}
                    typographyStyle="hint"
                    as="div"
                    flex="auto"
                >
                    {children}
                </Text>
            </Row>
        </Container>
    );
};
