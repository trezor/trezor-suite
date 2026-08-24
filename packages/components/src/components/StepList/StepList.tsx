import styled from 'styled-components';

import { type SpacingValue } from '@trezor/theme';

import { StepListContext } from './StepListContext';
import { StepListItem } from './StepListItem';
import { type BulletSize, type StepLineWidth, type StepListDirection } from './types';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export type { StepListItemState } from './types';

export const allowedStepListFrameProps = [
    'margin',
    'width',
    'overflow',
    'flex',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedStepListFrameProps)[number]>;

const Container = styled.ul<TransientProps<AllowedFrameProps> & { $direction: StepListDirection }>`
    display: flex;
    list-style-type: none;
    flex-direction: ${({ $direction }) => ($direction === 'vertical' ? 'column' : 'row')};
    align-items: stretch;
    counter-reset: item-counter;

    ${withFrameProps}
`;

export type StepListProps = AllowedFrameProps & {
    gap?: SpacingValue;
    bulletGap?: SpacingValue;
    titleGap?: SpacingValue;
    isOrdered?: boolean;
    isContentFullWidth?: boolean;
    bulletSize?: BulletSize;
    lineWidth?: StepLineWidth;
    direction?: StepListDirection;
    children: React.ReactNode;
    'data-testid'?: string;
};

export const StepList = ({
    gap = 32,
    bulletGap = 24,
    titleGap = 8,
    isOrdered = false,
    isContentFullWidth = false,
    bulletSize = 'large',
    lineWidth = 2,
    direction = 'vertical',
    'data-testid': dataTestId,
    children,
    ...rest
}: StepListProps) => {
    const frameProps = pickAndPrepareFrameProps(rest, allowedStepListFrameProps);

    return (
        <StepListContext.Provider
            value={{
                itemGap: gap,
                bulletGap,
                titleGap,
                isOrdered,
                isContentFullWidth,
                bulletSize,
                lineWidth,
                direction,
            }}
        >
            <Container data-testid={dataTestId} {...frameProps} $direction={direction}>
                {children}
            </Container>
        </StepListContext.Provider>
    );
};

StepList.Item = StepListItem;
