import { type ReactNode } from 'react';

import { type IconName } from '@suite-native/icons';
import { type NativeTypographyStyle } from '@trezor/theme';

import { Pictogram, type PictogramVariant } from '../Pictogram/Pictogram';
import { VStack } from '../Stack';
import { CenteredTitleHeader } from './CenteredTitleHeader';

export type PictogramTitleHeaderProps = {
    variant: PictogramVariant;
    icon?: IconName;
    title?: ReactNode;
    titleVariant?: NativeTypographyStyle;
    subtitle?: ReactNode;
};

export const PictogramTitleHeader = ({
    variant,
    icon,
    title,
    subtitle,
    titleVariant = 'headline-sm',
}: PictogramTitleHeaderProps) => (
    <VStack alignItems="center" spacing="sp24">
        <Pictogram variant={variant} icon={icon} />
        <CenteredTitleHeader title={title} subtitle={subtitle} titleVariant={titleVariant} />
    </VStack>
);
