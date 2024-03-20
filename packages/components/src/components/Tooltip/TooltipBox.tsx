import { Icon, IconType } from '../assets/Icon/Icon';
import { ReactElement, ReactNode } from 'react';
import { borders, palette, spacings, spacingsPx, typography } from '@trezor/theme';
import styled from 'styled-components';

export const TOOLTIP_BORDER_RADIUS = borders.radii.sm;

const getContainerPadding = (isLarge: boolean, isWithHeader: boolean) => {
    if (isLarge) {
        if (isWithHeader) {
            return `${spacingsPx.sm} ${spacingsPx.md} ${spacingsPx.xs}`;
        }

        return `${spacingsPx.xs} ${spacingsPx.md}`;
    }

    return spacingsPx.xs;
};

type TooltipContainerStyledProps = {
    $maxWidth: string | number;
    $isLarge: boolean;
    $isWithHeader: boolean;
};

const TooltipContainerStyled = styled.div<TooltipContainerStyledProps>`
    background: ${palette.darkGray300};
    color: ${palette.lightWhiteAlpha1000};
    border-radius: ${TOOLTIP_BORDER_RADIUS};
    text-align: left;
    border: solid 1.5px ${palette.darkGray100};
    max-width: ${props => props.$maxWidth}px;
    ${typography.hint}

    > div {
        padding: ${({ $isLarge, $isWithHeader }) => getContainerPadding($isLarge, $isWithHeader)};
    }
`;

const HeaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
    width: 100%;
`;

const TooltipTitle = styled.div<{ $isLarge: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    width: 100%;
    color: ${({ theme }) => theme.textSubdued};
    ${({ $isLarge }) => ($isLarge ? typography.highlight : typography.hint)}
`;

const Addon = styled.div`
    margin-left: auto;
`;

export type TooltipBoxProps = {
    content: ReactNode;
    maxWidth?: string | number;
    /**
     *  @deprecated Legacy prop
     */
    isLarge?: boolean;
    addon?: ReactNode;
    headerIcon?: IconType;
    title?: ReactElement;
};

type TooltipBoxExtendedProps = TooltipBoxProps &
    Required<Pick<TooltipBoxProps, 'maxWidth' | 'isLarge'>>;

export const TooltipBox = ({
    addon,
    maxWidth,
    isLarge,
    content,
    headerIcon,
    title,
}: TooltipBoxExtendedProps) => {
    const hasTitleOrAddon = title !== undefined || addon !== undefined;

    return (
        <TooltipContainerStyled
            $isLarge={isLarge}
            $isWithHeader={hasTitleOrAddon}
            $maxWidth={maxWidth}
            tabIndex={-1}
        >
            {hasTitleOrAddon && (
                <HeaderContainer>
                    {title && (
                        <TooltipTitle $isLarge={isLarge}>
                            {headerIcon && <Icon icon={headerIcon} size={spacings.md} />}
                            {title}
                        </TooltipTitle>
                    )}

                    {addon && <Addon>{addon}</Addon>}
                </HeaderContainer>
            )}

            <div>{content}</div>
        </TooltipContainerStyled>
    );
};
