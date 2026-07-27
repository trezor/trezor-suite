import styled, { css } from 'styled-components';

import { CheckIcon } from '@trezor/icons';
import { type SpacingValue, typography } from '@trezor/theme';

import { useStepList } from './StepListContext';
import {
    type BulletSize,
    type StepLineWidth,
    type StepListDirection,
    type StepListItemState,
} from './types';
import {
    mapPropsToTypographyStyle,
    mapSizeToCounterTypographyStyle,
    mapSizeToDimension,
    mapStateToBackgroundColor,
    mapStateToBorderColor,
    mapStateToBoxShadow,
    mapStateToBulletColor,
    mapStateToCounterColor,
    mapStateToTitleColor,
} from './utils';
import { IconCircle } from '../IconCircle/IconCircle';
import { Text } from '../typography/Text/Text';

const Item = styled.li<{
    $bulletGap: SpacingValue;
    $titleGap: SpacingValue;
    $size: BulletSize;
    $direction: StepListDirection;
}>`
    display: grid;
    grid-template-columns: ${mapSizeToDimension}px 1fr;

    ${({ $direction, $bulletGap, $titleGap }) =>
        $direction === 'vertical'
            ? css`
                  column-gap: ${$bulletGap}px;
              `
            : css`
                  flex: 1;
                  row-gap: ${$titleGap}px;

                  &:last-child {
                      flex: 0;
                  }
              `}
`;

const StepIndicatorWrapper = styled.div<{ $direction: StepListDirection }>`
    align-self: center;
    counter-increment: item-counter;
    position: relative;

    ${({ $direction }) =>
        $direction === 'horizontal' &&
        css`
            grid-column: 1;
            grid-row: 1;
            place-self: center;
        `}
`;

const StepIndicator = styled.div<{
    $state: StepListItemState;
    $isOrdered: boolean;
    $size: BulletSize;
}>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${mapSizeToDimension}px;
    height: ${mapSizeToDimension}px;
    border-radius: 50%;
    background-color: ${mapStateToBackgroundColor};
    outline: 2px solid ${mapStateToBorderColor};
    outline-offset: -2px;
    color: ${mapStateToCounterColor};
    box-shadow: ${mapStateToBoxShadow};

    ${({ $size }) => typography[mapSizeToCounterTypographyStyle({ $size })]}

    &::before {
        ${({ $isOrdered, $state, theme }) =>
            $isOrdered
                ? css`
                      content: counter(item-counter);
                  `
                : css`
                      content: '';
                      width: 25%;
                      height: 25%;
                      border-radius: 50%;
                      background-color: ${mapStateToBulletColor({ $state, theme })};
                  `}
    }
`;

const Title = styled.div<{ $direction: StepListDirection }>`
    align-self: center;
    overflow: hidden;

    ${({ $direction }) =>
        $direction === 'horizontal' &&
        css`
            grid-column: 1;
            grid-row: 2;
            text-align: center;
            place-self: center;
            overflow: visible;
        `}
`;

const Line = styled.div<{
    $direction: StepListDirection;
    $bulletGap: SpacingValue;
    $lineWidth: StepLineWidth;
}>`
    ${({ $direction, $bulletGap, $lineWidth }) =>
        $direction === 'horizontal'
            ? css`
                  grid-column: 2;
                  grid-row: 1;
                  margin: 0 ${$bulletGap}px;
                  border-top: ${$lineWidth}px dashed
                      ${({ theme }) => theme.elementBorderNeutralSofter};
                  place-self: center stretch;

                  ${Item}:last-child & {
                      display: none;
                  }
              `
            : css`
                  place-self: stretch center;
                  border-left: ${$lineWidth}px dashed
                      ${({ theme }) => theme.elementBorderNeutralSofter};
                  margin: ${$lineWidth}px 0;

                  ${Item}:last-child & {
                      opacity: 0;
                  }
              `}
`;

const Content = styled.div<{ $itemGap: SpacingValue; $titleGap: SpacingValue }>`
    padding-bottom: ${({ $itemGap }) => `${$itemGap}px`};

    &:not(:empty) {
        padding-top: ${({ $titleGap }) => `${$titleGap}px`};
    }

    ${Item}:last-child & {
        padding-bottom: 0;
    }
`;

export type StepListItemProps = {
    children?: React.ReactNode;
    title: React.ReactNode;
    state?: StepListItemState;
    'data-testid'?: string;
};

export const StepListItem = ({
    state = 'default',
    title,
    'data-testid': dataTestId,
    children,
}: StepListItemProps) => {
    const { itemGap, bulletGap, titleGap, bulletSize, isOrdered, direction, lineWidth } =
        useStepList();

    return (
        <Item
            $bulletGap={bulletGap}
            $titleGap={titleGap}
            $size={bulletSize}
            $direction={direction}
            data-testid={dataTestId}
        >
            <StepIndicatorWrapper $direction={direction}>
                {state === 'done' ? (
                    <IconCircle
                        icon={CheckIcon}
                        size={mapSizeToDimension({ $size: bulletSize })}
                        intent="brand"
                    />
                ) : (
                    <StepIndicator $state={state} $isOrdered={isOrdered} $size={bulletSize} />
                )}
            </StepIndicatorWrapper>
            <Title $direction={direction}>
                <Text
                    as="div"
                    typographyStyle={mapPropsToTypographyStyle(direction, state)}
                    color={mapStateToTitleColor(state)}
                    ellipsisLineCount={direction === 'vertical' ? 2 : undefined}
                >
                    {title}
                </Text>
            </Title>
            <Line $direction={direction} $bulletGap={bulletGap} $lineWidth={lineWidth} />
            {direction === 'vertical' && (
                <Content $itemGap={itemGap} $titleGap={titleGap}>
                    {children && (
                        <Text as="div" typographyStyle="body-sm">
                            {children}
                        </Text>
                    )}
                </Content>
            )}
        </Item>
    );
};
