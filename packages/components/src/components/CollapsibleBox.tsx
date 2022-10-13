import React, { useState, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import useMeasure from 'react-use/lib/useMeasure';
import { Icon } from './Icon';
import * as variables from '../config/variables';

const Wrapper = styled.div<Pick<CollapsibleBoxProps, 'variant'>>`
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.BG_GREY};
    margin-bottom: 20px;

    ${({ variant }) =>
        (variant === 'tiny' || variant === 'small') &&
        css`
            border-radius: 4px;
        `}

    ${({ variant, theme }) =>
        variant === 'large' &&
        css`
            border-radius: 16px;
            box-shadow: 0 2px 5px 0 ${theme.BOX_SHADOW_BLACK_20};
        `}
`;

const Header = styled.div<Pick<CollapsibleBoxProps, 'variant' | 'headerJustifyContent'>>`
    display: flex;
    justify-content: ${({ headerJustifyContent }) => headerJustifyContent};
    align-items: center;
    cursor: pointer;

    ${({ variant }) =>
        variant === 'tiny' &&
        css`
            padding: 8px 16px;
        `}

    ${({ variant }) =>
        variant === 'small' &&
        css`
            padding: 12px 16px;
        `}

    ${({ variant }) =>
        variant === 'large' &&
        css`
            padding: 24px 30px;

            ${variables.SCREEN_QUERY.MOBILE} {
                padding: 24px 18px;
            }
        `}
`;

const IconWrapper = styled.div<Pick<CollapsibleBoxProps, 'headerJustifyContent'>>`
    display: flex;
    align-items: center;
    overflow: hidden;
    margin-left: 24px;
    padding-left: ${({ headerJustifyContent }) => headerJustifyContent === 'center' && '2px'};
`;

const IconLabel = styled.div`
    margin-right: 6px;
    margin-left: 28px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Heading = styled.span<Pick<CollapsibleBoxProps, 'variant'>>`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${({ variant }) =>
        variant === 'tiny' &&
        css`
            font-size: ${variables.NEUE_FONT_SIZE.NANO};
        `}

    ${({ variant }) =>
        (variant === 'small' || variant === 'large') &&
        css`
            font-size: ${variables.NEUE_FONT_SIZE.SMALL};
        `}
`;

const Content = styled.div<{
    variant: CollapsibleBoxProps['variant'];
    $noContentPadding?: boolean;
}>`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-top: 1px solid ${({ theme }) => theme.STROKE_GREY};

    ${({ $noContentPadding, variant }) =>
        !$noContentPadding &&
        variant === 'tiny' &&
        css`
            padding: 15px 16px;
        `}

    ${({ $noContentPadding, variant }) =>
        !$noContentPadding &&
        variant === 'small' &&
        css`
            padding: 20px 16px;
        `}

    ${({ $noContentPadding, variant }) =>
        !$noContentPadding &&
        variant === 'large' &&
        css`
            padding: 20px 30px;
        `}
`;

type CollapserProps = { $maxHeight?: number };

const Collapser = styled.div.attrs<CollapserProps>(({ $maxHeight }) => ({
    style: {
        maxHeight: $maxHeight ?? 'initial',
    },
}))<CollapserProps>`
    overflow: hidden;
    transition: max-height 0.35s ease-in-out;
`;

interface CollapsibleBoxProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
    heading: React.ReactNode;
    variant: 'tiny' | 'small' | 'large';
    iconLabel?: React.ReactNode;
    children?: React.ReactNode;
    noContentPadding?: boolean;
    headerJustifyContent?: 'space-between' | 'center';
    opened?: boolean;
    headingButton?: ({
        collapsed,
        animatedIcon,
    }: {
        collapsed: boolean;
        animatedIcon: boolean;
    }) => React.ReactNode;
}

type CollapsibleBoxSubcomponents = {
    Header: typeof Header;
    Heading: typeof Heading;
    Content: typeof Content;
    IconWrapper: typeof IconWrapper;
};

const CollapsibleBox: React.FC<CollapsibleBoxProps> & CollapsibleBoxSubcomponents = ({
    heading,
    iconLabel,
    children,
    noContentPadding,
    variant = 'small',
    headerJustifyContent = 'space-between',
    opened = false,
    headingButton,
    ...rest
}: CollapsibleBoxProps) => {
    const [collapsed, setCollapsed] = useState(!opened);
    const [animatedIcon, setAnimatedIcon] = useState(false);

    const [heightRef, { height }] = useMeasure<HTMLDivElement>();

    useEffect(() => {
        setCollapsed(!opened);
    }, [opened]);

    const handleHeaderClick = useCallback(() => {
        setCollapsed(!collapsed);
        setAnimatedIcon(true);
    }, [collapsed]);

    return (
        <Wrapper variant={variant} {...rest}>
            <Header
                variant={variant}
                headerJustifyContent={headerJustifyContent}
                onClick={handleHeaderClick}
            >
                <Heading variant={variant}>{heading ?? iconLabel}</Heading>

                {headingButton ? (
                    headingButton({ collapsed, animatedIcon })
                ) : (
                    <IconWrapper headerJustifyContent={headerJustifyContent}>
                        {heading && iconLabel && <IconLabel>{iconLabel}</IconLabel>}
                        <Icon
                            icon="ARROW_DOWN"
                            size={variant === 'tiny' ? 12 : 20}
                            canAnimate={animatedIcon}
                            isActive={!collapsed}
                        />
                    </IconWrapper>
                )}
            </Header>

            <Collapser
                $maxHeight={collapsed ? 0 : height || undefined}
                data-test="@collapsible-box/body"
            >
                {/* This div is here because of the ref, ref on styled-component (Content) will result with unnecessary re-render */}
                <div ref={heightRef} style={{ overflow: 'hidden' }}>
                    <Content variant={variant} $noContentPadding={noContentPadding}>
                        {children}
                    </Content>
                </div>
            </Collapser>
        </Wrapper>
    );
};

CollapsibleBox.Header = Header;
CollapsibleBox.Heading = Heading;
CollapsibleBox.Content = Content;
CollapsibleBox.IconWrapper = IconWrapper;

export { CollapsibleBox };
