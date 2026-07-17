import { type ReactNode } from 'react';

import styled from 'styled-components';

import { CheckIcon } from '@trezor/icons';

import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
} from '../../utils/frameProps';
import { Box } from '../Box/Box';
import { Card } from '../Card/Card';
import { Icon } from '../Icon/Icon';

export const allowedRadioCardFrameProps = [
    'margin',
    'flex',
    'width',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedRadioCardFrameProps)[number]>;

export type RadioCardProps = {
    isSelected: boolean;
    isDisabled?: boolean;
    children: ReactNode;
    onClick?: () => void;
    dataTestId?: string;
} & AllowedFrameProps;

const Wrapper = styled.div<{ $isDisabled: boolean }>`
    position: relative;

    ${({ $isDisabled }) =>
        $isDisabled &&
        `
            opacity: 0.5;
            cursor: not-allowed;
        `}
`;

export const RadioCard = ({
    isSelected,
    isDisabled = false,
    onClick,
    children,
    dataTestId,
    ...rest
}: RadioCardProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedRadioCardFrameProps);

    return (
        <Wrapper $isDisabled={isDisabled}>
            <Card
                onClick={!isDisabled ? onClick : undefined}
                isSelected={isSelected}
                data-testid={dataTestId}
                type="contrast"
                {...frameProps}
            >
                {children}
            </Card>
            {isSelected && (
                <Box
                    position={{ type: 'absolute', top: '-4px', right: '-4px' }}
                    borderRadius="full"
                    backgroundColor="borderBrand"
                    padding={2}
                >
                    <Icon as={CheckIcon} size={12} color="contentPrimaryInverse" />
                </Box>
            )}
        </Wrapper>
    );
};
