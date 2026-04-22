import styled, { css, useTheme } from 'styled-components';

import { type SpacingValuesNew, typography } from '@trezor/theme';

import { useBulletList } from './BulletListContext';
import {
    type BulletLineWidth,
    type BulletListDirection,
    type BulletListItemState,
    type BulletSize,
} from './types';
import { mapPropsToTypographyStyle, mapSizeToDimension, mapStateToTextColor } from './utils';
import { IconCircle } from '../IconCircle/IconCircle';
import { Text } from '../typography/Text/Text';

const Item = styled.li<{
    $bulletGap: SpacingValuesNew;
    $titleGap: SpacingValuesNew;
    $size: BulletSize;
    $direction: BulletListDirection;
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

const BulletWrapper = styled.div<{ $direction: BulletListDirection }>`
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

const Bullet = styled.div<{
    $state: BulletListItemState;
    $isOrdered: boolean;
    $size: BulletSize;
    $isDarkTheme: boolean;
}>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${mapSizeToDimension}px;
    height: ${mapSizeToDimension}px;
    border-radius: 50%;
    background-color: ${({ theme, $isDarkTheme, $state }) =>
        // eslint-disable-next-line no-nested-ternary
        $state === 'active'
            ? theme.legacyBackgroundPrimarySubtleOnElevation0
            : $isDarkTheme
              ? theme.contentPrimaryInverse
              : theme.legacyBackgroundNeutralSubtleOnElevation0};
    color: ${({ $state, theme }) => theme[mapStateToTextColor($state)]};
    ${({ $size }) => ($size === 'small' ? typography['body-xs'] : typography['body-sm'])}

    ${({ $state, $isOrdered, theme }) =>
        $state === 'active' &&
        $isOrdered &&
        css`
            background-color: ${theme.contentPrimaryInverse};
            box-shadow: ${theme.boxShadowBase};
        `}

    &::before {
        ${({ $isOrdered, $isDarkTheme, $state, theme }) =>
            $isOrdered
                ? css`
                      content: counter(item-counter);
                  `
                : css`
                      content: '';
                      width: 50%;
                      height: 50%;
                      border-radius: 50%;
                      background-color: ${
                          // eslint-disable-next-line no-nested-ternary
                          $state === 'active'
                              ? theme.legacyBackgroundPrimaryDefault
                              : $isDarkTheme
                                ? theme.elementFillBoldDisabled
                                : theme.contentPrimaryInverse
                      };
                      box-shadow: ${!$isDarkTheme && $state !== 'active' && theme.boxShadowBase};
                  `}
    }
`;

const Title = styled.div<{ $direction: BulletListDirection }>`
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
    $size: BulletSize;
    $direction: BulletListDirection;
    $bulletGap: SpacingValuesNew;
    $lineWidth: BulletLineWidth;
}>`
    ${({ $direction, $bulletGap, $size, $lineWidth }) =>
        $direction === 'horizontal'
            ? css`
                  grid-column: 2;
                  grid-row: 1;
                  margin: 0 ${$bulletGap}px;
                  border-top: ${$lineWidth}px dashed ${({ theme }) => theme.borderNeutral};
                  place-self: center stretch;

                  ${Item}:last-child & {
                      display: none;
                  }
              `
            : css`
                  place-self: stretch center;
                  border-left: ${$lineWidth}px dashed ${({ theme }) => theme.borderNeutral};
                  margin: calc(${mapSizeToDimension({ $size })}px * -0.5) 0;

                  ${Item}:last-child & {
                      opacity: 0;
                  }
              `}
`;

const Content = styled.div<{ $itemGap: SpacingValuesNew; $titleGap: SpacingValuesNew }>`
    padding-bottom: ${({ $itemGap }) => `${$itemGap}px`};

    &:not(:empty) {
        padding-top: ${({ $titleGap }) => `${$titleGap}px`};
    }

    ${Item}:last-child & {
        padding-bottom: 0;
    }
`;

export type BulletListItemProps = {
    children?: React.ReactNode;
    title: React.ReactNode;
    state?: BulletListItemState;
    'data-testid'?: string;
};

export const BulletListItem = ({
    state = 'default',
    title,
    'data-testid': dataTestId,
    children,
}: BulletListItemProps) => {
    const { itemGap, bulletGap, titleGap, bulletSize, isOrdered, direction, lineWidth } =
        useBulletList();
    const theme = useTheme();
    const isDarkTheme = theme.variant === 'dark';

    return (
        <Item
            $bulletGap={bulletGap}
            $titleGap={titleGap}
            $size={bulletSize}
            $direction={direction}
            data-testid={dataTestId}
        >
            <BulletWrapper $direction={direction}>
                {state === 'done' ? (
                    <IconCircle
                        name="check"
                        size={mapSizeToDimension({ $size: bulletSize })}
                        intent="brand"
                    />
                ) : (
                    <Bullet
                        $state={state}
                        $isOrdered={isOrdered}
                        $size={bulletSize}
                        $isDarkTheme={isDarkTheme}
                    />
                )}
            </BulletWrapper>
            <Title $direction={direction}>
                <Text
                    as="div"
                    typographyStyle={mapPropsToTypographyStyle(direction, state)}
                    color={mapStateToTextColor(state)}
                    ellipsisLineCount={direction === 'vertical' ? 2 : undefined}
                >
                    {title}
                </Text>
            </Title>
            <Line
                $size={bulletSize}
                $direction={direction}
                $bulletGap={bulletGap}
                $lineWidth={lineWidth}
            />
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
