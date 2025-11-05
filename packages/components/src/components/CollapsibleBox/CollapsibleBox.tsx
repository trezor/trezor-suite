import { ReactNode, useState } from 'react';

import styled, { css } from 'styled-components';

import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import { CollapsibleHeader } from './CollapsibleHeader';
import {
    CollapsibleHeaderContent,
    CollapsibleHeaderContentProps,
} from './CollapsibleHeaderContent';
import { FillType, PaddingType } from './types';
import { mapPaddingTypeToContentPadding } from './utils';
import { Collapsible } from '../Collapsible/Collapsible';
import { ElevationUp, useElevation } from './../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

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

type ContentProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
    $hasDivider: boolean;
};

export type CollapsibleBoxProps = AllowedFrameProps & {
    paddingType?: PaddingType;
    fillType?: FillType;
    children?: ReactNode;
    hasDivider?: boolean;
    onAnimationComplete?: (isOpen: boolean) => void;
    'data-testid'?: string;
    'data-testid-toggle'?: string;
    defaultIsOpen?: boolean;
    collapsible?: boolean;
    headerHoverEffect?: boolean;
} & Pick<
        CollapsibleHeaderContentProps,
        | 'heading'
        | 'subHeading'
        | 'headingSize'
        | 'toggleLabel'
        | 'toggleComponent'
        | 'toggleIconName'
        | 'toggleIconSize'
        | 'toggleIconVariant'
    >;

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
    paddingType = 'normal',
    heading,
    subHeading,
    headingSize,
    toggleLabel,
    toggleIconName,
    toggleIconSize,
    toggleIconVariant,
    toggleComponent,
    fillType = 'default',
    hasDivider = true,
    children,
    onAnimationComplete,
    'data-testid': dataTest,
    'data-testid-toggle': dataTestToggleId = '@collapsible-box/toggle',
    collapsible = true,
    headerHoverEffect = true,
    ...rest
}: CollapsibleBoxProps) => {
    const { elevation } = useElevation();
    const [isOpen, setIsOpen] = useState(defaultIsOpen);
    const frameProps = pickAndPrepareFrameProps(rest, allowedCollapsibleBoxFrameProps);

    return (
        <Container
            {...frameProps}
            $paddingType={paddingType}
            $elevation={elevation}
            $fillType={fillType}
            data-testid={dataTest}
        >
            <Collapsible isOpen={isOpen && collapsible}>
                <Collapsible.Toggle
                    data-testid={dataTestToggleId}
                    onClick={() => {
                        if (collapsible) {
                            setIsOpen(!isOpen);
                        }
                    }}
                    disabled={!collapsible}
                >
                    <CollapsibleHeader
                        paddingType={paddingType}
                        fillType={fillType}
                        collapsible={collapsible}
                        hoverEffect={headerHoverEffect}
                    >
                        <CollapsibleHeaderContent
                            isOpen={isOpen}
                            heading={heading}
                            subHeading={subHeading}
                            toggleLabel={toggleLabel}
                            toggleComponent={toggleComponent}
                            toggleIconName={toggleIconName}
                            toggleIconSize={toggleIconSize}
                            toggleIconVariant={toggleIconVariant}
                            collapsible={collapsible}
                        />
                    </CollapsibleHeader>
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
