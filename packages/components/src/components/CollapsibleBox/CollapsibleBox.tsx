import { ReactNode, useState } from 'react';

import styled, { css } from 'styled-components';

import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacings,
    spacingsPx,
} from '@trezor/theme';

import { FillType, HeadingSize, PaddingType } from './types';
import {
    mapPaddingTypeToContentPadding,
    mapPaddingTypeToHeaderPadding,
    mapSizeToHeadingTypography,
    mapSizeToIconSize,
    mapSizeToSubheadingTypography,
} from './utils';
import { Collapsible } from '../Collapsible/Collapsible';
import { Column, Row } from '../Flex/Flex';
import { IconName } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';
import { ElevationUp, useElevation } from './../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedCollapsibleBoxFrameProps = ['margin'] as const satisfies FramePropsKeys[];
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
    toggleComponent?: ReactNode;
    toggleIconName?: IconName;
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
    toggleIconName,
    paddingType = 'normal',
    heading,
    subHeading,
    headingSize = 'large',
    fillType = 'default',
    hasDivider = true,
    children,
    onAnimationComplete,
    'data-testid': dataTest,
    ...rest
}: CollapsibleBoxProps) => {
    const { elevation } = useElevation();
    const [isOpen, setIsOpen] = useState(defaultIsOpen);
    const frameProps = pickAndPrepareFrameProps(rest, allowedCollapsibleBoxFrameProps);

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
                        variant="tertiary"
                    >
                        {subHeading}
                    </Text>
                )}
            </Column>
            <Toggle>
                <Row gap={spacings.sm}>
                    {toggleLabel && (
                        <Text typographyStyle="hint" variant="tertiary">
                            {toggleLabel}
                        </Text>
                    )}
                    <Collapsible.ToggleIcon
                        isOpen={isOpen}
                        iconName={toggleIconName}
                        size={mapSizeToIconSize({ $headingSize: headingSize })}
                        data-testid={`@collapsible-box/icon-${isOpen ? 'expanded' : 'collapsed'}`}
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
