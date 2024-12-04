import styled, { css, useTheme } from 'styled-components';

import { SpacingValues, Elevation, mapElevationToBorder, borders, typography } from '@trezor/theme';

import { useBulletList } from './BulletList';
import { Text } from '../typography/Text/Text';
import { useElevation } from '../ElevationContext/ElevationContext';
import { IconCircle } from '../IconCircle/IconCircle';
import { BulletSize, BulletListItemState } from './types';
import { mapStateToColor, mapSizeToDimension } from './utils';

const Item = styled.li<{ $bulletGap: SpacingValues; $size: BulletSize }>`
    display: grid;
    columns: 2;
    grid-template-columns: ${mapSizeToDimension}px 1fr;
    column-gap: ${({ $bulletGap }) => `${$bulletGap}px`};
`;

const BulletWraper = styled.div`
    align-self: center;
    counter-increment: item-counter;
    position: relative;
`;

const Bullet = styled.div<{
    $elevation: Elevation;
    $state: BulletListItemState;
    $isOrdered: boolean;
    $size: BulletSize;
}>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${mapSizeToDimension}px;
    height: ${mapSizeToDimension}px;
    border-radius: 50%;
    background-color: ${mapElevationToBorder};
    color: ${mapStateToColor};
    ${({ $size }) => ($size === 'small' ? typography.label : typography.hint)}

    &::before {
        ${({ $isOrdered }) =>
            $isOrdered
                ? css`
                      content: counter(item-counter);
                  `
                : css`
                      content: '';
                      width: 50%;
                      height: 50%;
                      border-radius: 50%;
                      background: ${({ theme }) => theme.textDefaultInverted};
                      box-shadow: ${({ theme }) => theme.boxShadowBase};
                  `}
    }
`;

const Title = styled.div`
    align-self: center;
    overflow: hidden;
`;

const Line = styled.div<{ $size: BulletSize }>`
    place-self: stretch center;
    border-left: ${borders.widths.large} dashed ${({ theme }) => theme.borderDashed};
    margin: calc(${mapSizeToDimension}px * -0.5) 0;

    ${Item}:last-child & {
        opacity: 0;
    }
`;

const Content = styled.div<{ $itemGap: SpacingValues; $titleGap: SpacingValues }>`
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
    const { itemGap, bulletGap, titleGap, bulletSize, isOrdered } = useBulletList();
    const { elevation } = useElevation();
    const theme = useTheme();

    return (
        <Item $bulletGap={bulletGap} $size={bulletSize} data-testid={dataTestId}>
            <BulletWraper>
                {state === 'done' ? (
                    <IconCircle
                        name="check"
                        size={mapSizeToDimension({ $size: bulletSize })}
                        hasBorder={false}
                        variant="primary"
                    />
                ) : (
                    <Bullet
                        $state={state}
                        $elevation={elevation}
                        $isOrdered={isOrdered}
                        $size={bulletSize}
                    />
                )}
            </BulletWraper>
            <Title>
                <Text
                    as="div"
                    typographyStyle="body"
                    color={mapStateToColor({ $state: state, theme })}
                    ellipsisLineCount={2}
                >
                    {title}
                </Text>
            </Title>
            <Line $size={bulletSize} />
            <Content $itemGap={itemGap} $titleGap={titleGap}>
                {children && (
                    <Text as="div" typographyStyle="hint">
                        {children}
                    </Text>
                )}
            </Content>
        </Item>
    );
};
