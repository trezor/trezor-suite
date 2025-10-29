import { ReactNode } from 'react';

import styled from 'styled-components';

import { spacings } from '@trezor/theme';

import { HeadingSize } from './types';
import {
    mapSizeToHeadingTypography,
    mapSizeToIconSize,
    mapSizeToSubheadingTypography,
} from './utils';
import { Collapsible } from '../Collapsible/Collapsible';
import { Column, Row } from '../Flex/Flex';
import { IconName, IconProps, IconSize } from '../Icon/Icon';
import { Text } from '../typography/Text/Text';

export const Toggle = styled.div`
    transition: opacity 0.15s;
`;

export interface CollapsibleHeaderContentProps {
    isOpen: boolean;
    headingSize?: HeadingSize;
    heading: ReactNode;
    subHeading?: ReactNode;
    toggleLabel?: ReactNode;
    toggleComponent?: ReactNode;
    toggleIconName?: IconName;
    toggleIconSize?: IconSize;
    toggleIconVariant?: IconProps['variant'];
    collapsible?: boolean;
}

export function CollapsibleHeaderContent({
    isOpen,
    headingSize = 'large',
    heading,
    subHeading,
    toggleLabel,
    toggleComponent,
    toggleIconName = 'caretCircleDown',
    toggleIconSize = 'large',
    toggleIconVariant,
    collapsible,
}: CollapsibleHeaderContentProps) {
    return (
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
                    {toggleComponent}
                    {collapsible && (
                        <Collapsible.ToggleIcon
                            iconName={toggleIconName}
                            size={
                                toggleIconSize ?? mapSizeToIconSize({ $headingSize: headingSize })
                            }
                            data-testid={`@collapsible-box/icon-${isOpen ? 'expanded' : 'collapsed'}`}
                            variant={toggleIconVariant}
                        />
                    )}
                </Row>
            </Toggle>
        </Row>
    );
}
