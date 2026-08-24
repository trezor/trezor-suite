import { type KeyboardEvent } from 'react';

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
import { commonFocusStyles } from '../../utils/utils';
import { IconCircle } from '../IconCircle/IconCircle';
import { Text } from '../typography/Text/Text';

const Item = styled.li<{ $direction: StepListDirection }>`
    ${({ $direction }) =>
        $direction === 'horizontal' &&
        css`
            flex: 1;

            &:last-child {
                flex: 0;
            }
        `}
`;

const ItemLayout = styled.div<{
    $bulletGap: SpacingValue;
    $titleGap: SpacingValue;
    $size: BulletSize;
    $direction: StepListDirection;
    $isClickable: boolean;
}>`
    display: grid;
    grid-template-columns: ${mapSizeToDimension}px 1fr;

    ${({ $isClickable }) =>
        $isClickable &&
        css`
            cursor: pointer;

            &:focus-visible {
                ${commonFocusStyles}
            }
        `}

    ${({ $direction, $bulletGap, $titleGap }) =>
        $direction === 'vertical'
            ? css`
                  column-gap: ${$bulletGap}px;
              `
            : css`
                  row-gap: ${$titleGap}px;
              `}
`;

const ClickableDoneIndicator = styled.div`
    > :last-child {
        display: none;
    }

    ${ItemLayout}:hover &,
    ${ItemLayout}:focus-visible & {
        > :first-child {
            display: none;
        }

        > :last-child {
            display: flex;
        }
    }
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
    ${({ $lineWidth }) =>
        $lineWidth === 0 &&
        css`
            display: none;
        `}

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

const Content = styled.div<{
    $itemGap: SpacingValue;
    $titleGap: SpacingValue;
    $isFullWidth: boolean;
}>`
    ${({ $isFullWidth }) =>
        $isFullWidth &&
        css`
            grid-column: 1 / -1;
        `}

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
    onClick?: () => void;
    'data-testid'?: string;
};

export const StepListItem = ({
    state = 'default',
    title,
    onClick,
    'data-testid': dataTestId,
    children,
}: StepListItemProps) => {
    const {
        itemGap,
        bulletGap,
        titleGap,
        bulletSize,
        isOrdered,
        isContentFullWidth,
        direction,
        lineWidth,
    } = useStepList();
    const isClickable = !!onClick;

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick?.();
        }
    };

    const renderStepIndicator = () => {
        if (state !== 'done') {
            return <StepIndicator $state={state} $isOrdered={isOrdered} $size={bulletSize} />;
        }

        const doneIcon = (
            <IconCircle
                icon={CheckIcon}
                size={mapSizeToDimension({ $size: bulletSize })}
                intent="brand"
            />
        );

        if (!isClickable) {
            return doneIcon;
        }

        return (
            <ClickableDoneIndicator>
                {doneIcon}
                <StepIndicator $state={state} $isOrdered={isOrdered} $size={bulletSize} />
            </ClickableDoneIndicator>
        );
    };

    return (
        <Item $direction={direction} data-testid={dataTestId}>
            <ItemLayout
                $bulletGap={bulletGap}
                $titleGap={titleGap}
                $size={bulletSize}
                $direction={direction}
                $isClickable={isClickable}
                onClick={onClick}
                {...(isClickable && { role: 'button', tabIndex: 0, onKeyDown: handleKeyDown })}
            >
                <StepIndicatorWrapper $direction={direction}>
                    {renderStepIndicator()}
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
                    <Content
                        $itemGap={itemGap}
                        $titleGap={titleGap}
                        $isFullWidth={isContentFullWidth}
                    >
                        {children && (
                            <Text as="div" typographyStyle="body-sm">
                                {children}
                            </Text>
                        )}
                    </Content>
                )}
            </ItemLayout>
        </Item>
    );
};
