import { type ReactNode, useState } from 'react';

import styled, { css } from 'styled-components';

import {
    type Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacings,
    spacingsPx,
} from '@trezor/theme';

import { type FillType, type HeadingSize, type PaddingType } from './types';
import {
    mapPaddingTypeToContentPadding,
    mapPaddingTypeToHeaderPadding,
    mapSizeToHeadingTypography,
    mapSizeToIconSize,
    mapSizeToSubheadingTypography,
} from './utils';
import { Collapsible } from '../Collapsible/Collapsible';
import { Column, Row } from '../Flex/Flex';
import { type IconName, type IconProps, type IconSize } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';
import { ElevationUp, useElevation } from './../ElevationContext/ElevationContext';
import {
    type FrameProps,
    type FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { type TransientProps } from '../../utils/transientProps';

export const allowedCollapsibleBoxFrameProps = [
    'margin',
    'overflow',
] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCollapsibleBoxFrameProps)[number]>;

type ContainerProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
    $fillType: FillType;
};

type HeaderProps = {
    $paddingType: PaddingType;
};

type ContentProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
    $hasDivider: boolean;
};

export type CollapsibleBoxProps = AllowedFrameProps & {
    heading: ReactNode;
    subHeading?: ReactNode;
    headingSize?: HeadingSize;
    paddingType?: PaddingType;
    fillType?: FillType;
    toggleLabel?: ReactNode;
    toggleIconName?: IconName;
    toggleIconSize?: IconSize;
    toggleIconIntent?: IconProps['intent'];
    toggleIconPriority?: IconProps['priority'];
    toggleIconIsDisabled?: IconProps['isDisabled'];
    children?: ReactNode;
    hasDivider?: boolean;
    onAnimationComplete?: (isOpen: boolean) => void;
    'data-testid'?: string;
    defaultIsOpen?: boolean;
};

const Container = styled.section<TransientProps<AllowedFrameProps> & ContainerProps>`
    width: 100%;
    border-radius: ${borders.radii.sm};
    transition: background 0.3s;
    background: ${mapElevationToBackground};
    border: 1px solid ${mapElevationToBorder};

    ${({ $paddingType, theme }) =>
        $paddingType === 'large' &&
        css`
            border-radius: ${borders.radii.md};
            box-shadow: ${theme.boxShadowBase};
        `}

    ${({ $fillType }) =>
        $fillType === 'none' &&
        css`
            background: none;
            border: none;
            box-shadow: none;
        `}

    ${withFrameProps}
`;

const Toggle = styled.div`
    transition: opacity 0.15s;
`;

const Header = styled.header<HeaderProps>`
    padding: ${mapPaddingTypeToHeaderPadding};
    cursor: pointer;

    &:hover {
        ${Toggle} {
            opacity: 0.5;
        }
    }
`;

const Content = styled.div<ContentProps>`
    display: flex;
    flex-direction: column;
    padding: ${mapPaddingTypeToContentPadding};

    ${({ theme, $elevation, $hasDivider }) =>
        $hasDivider &&
        css`
            border-top: 1px solid ${mapElevationToBorder({ $elevation, theme })};
        `}

    ${({ $paddingType, $hasDivider }) => css`
        ${$paddingType === 'none' && $hasDivider && `margin-top: ${spacingsPx.xs};`}
        ${$paddingType !== 'none' && !$hasDivider && `padding-top: 0;`}
    `}
`;

export const CollapsibleBox = ({
    defaultIsOpen = false,
    toggleLabel,
    toggleIconName = 'caretCircleDown',
    paddingType = 'normal',
    heading,
    subHeading,
    headingSize = 'large',
    toggleIconSize,
    toggleIconIntent,
    toggleIconPriority,
    toggleIconIsDisabled,
    fillType = 'default',
    hasDivider = true,
    children,
    onAnimationComplete,
    'data-testid': dataTest,
    ...rest
}: CollapsibleBoxProps) => {
    const { elevation } = useElevation();
    const [isOpen, setIsOpen] = useState(defaultIsOpen);
    const frameProps = pickAndPrepareFrameProps(
        rest,
        allowedCollapsibleBoxFrameProps,
    ) as TransientProps<AllowedFrameProps>;

    const headerContent = (
        <Row gap={spacings.xs} justifyContent="space-between">
            <Column alignItems="flex-start">
                <Text
                    as="div"
                    typographyStyle={mapSizeToHeadingTypography({
                        $headingSize: headingSize,
                    })}
                >
                    {heading}
                </Text>
                {subHeading && (
                    <Text
                        as="div"
                        typographyStyle={mapSizeToSubheadingTypography({
                            $headingSize: headingSize,
                        })}
                        intent="neutral"
                        priority="secondary"
                    >
                        {subHeading}
                    </Text>
                )}
            </Column>
            <Toggle>
                <Row gap={spacings.sm}>
                    {toggleLabel && (
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            {toggleLabel}
                        </Text>
                    )}
                    <Collapsible.ToggleIcon
                        iconName={toggleIconName}
                        size={toggleIconSize ?? mapSizeToIconSize({ $headingSize: headingSize })}
                        data-testid={`@collapsible-box/icon-${isOpen ? 'expanded' : 'collapsed'}`}
                        intent={toggleIconIntent}
                        priority={toggleIconPriority}
                        isDisabled={toggleIconIsDisabled}
                    />
                </Row>
            </Toggle>
        </Row>
    );

    return (
        <Container
            {...frameProps}
            $paddingType={paddingType}
            $elevation={elevation}
            $fillType={fillType}
            data-testid={dataTest}
        >
            <Collapsible isOpen={isOpen}>
                <Collapsible.Toggle onClick={() => setIsOpen(!isOpen)}>
                    <Header $paddingType={paddingType}>
                        {fillType === 'none' ? (
                            headerContent
                        ) : (
                            <ElevationUp>{headerContent}</ElevationUp>
                        )}
                    </Header>
                </Collapsible.Toggle>
                <Collapsible.Content
                    data-testid="@collapsible-box/body"
                    onAnimationComplete={onAnimationComplete}
                    overflow={frameProps.$overflow}
                >
                    <Content
                        $elevation={elevation}
                        $paddingType={paddingType}
                        $hasDivider={hasDivider}
                    >
                        {fillType === 'none' ? children : <ElevationUp>{children}</ElevationUp>}
                    </Content>
                </Collapsible.Content>
            </Collapsible>
        </Container>
    );
};
