import styled from 'styled-components';

import { ExclusiveColorOrVariant, Icon, IconName } from '../Icon/Icon';
import { TransientProps } from '../../utils/transientProps';
import { NewModalVariant } from './types';
import { mapVariantToIconBackground, mapVariantToIconBorderColor } from './utils';
import { borders, CSSColor, spacingsPx } from '@trezor/theme';

const ICON_SIZE = 40;

export type NewModalIconColors = { foreground: CSSColor; background: CSSColor };

export type NewModalIconExclusiveColorOrVariant =
    | { variant?: NewModalVariant; iconColor?: undefined }
    | { variant?: undefined; iconColor?: NewModalIconColors };

type IconWrapperProps = TransientProps<NewModalIconExclusiveColorOrVariant> & {
    $size: number;
    $isPushedTop: boolean;
};

const IconWrapper = styled.div<IconWrapperProps>`
    width: ${({ $size }) => $size}px;
    background: ${props => mapVariantToIconBackground(props)};
    padding: ${spacingsPx.lg};
    border-radius: ${borders.radii.full};
    border: ${spacingsPx.sm} solid ${props => mapVariantToIconBorderColor(props)};
    box-sizing: content-box;
    margin-bottom: ${spacingsPx.md};
    margin-top: ${({ $isPushedTop }) => ($isPushedTop ? `-${spacingsPx.md}` : 0)};
`;

type NewModalIconProps = {
    isPushedTop?: boolean;
    iconName: IconName;
} & NewModalIconExclusiveColorOrVariant;

export const NewModalIcon = ({
    isPushedTop = false,
    iconName,
    iconColor,
    variant,
}: NewModalIconProps) => {
    const wrapperColorOrVariant: TransientProps<NewModalIconExclusiveColorOrVariant> =
        iconColor === undefined ? { $variant: variant ?? 'primary' } : { $iconColor: iconColor };

    const iconColorOrVariant: ExclusiveColorOrVariant =
        iconColor === undefined
            ? { variant: variant ?? 'primary' }
            : { color: iconColor.foreground };

    return (
        <IconWrapper $size={ICON_SIZE} $isPushedTop={isPushedTop} {...wrapperColorOrVariant}>
            <Icon name={iconName} size={ICON_SIZE} {...iconColorOrVariant} />
        </IconWrapper>
    );
};
