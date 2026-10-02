import { IconSquare } from '../../../Icon/IconSquare';

type TimelineDetailsCardItemIconProps = { index: number };

const defaultItemIconProps = {
    iconSize: 'large',
    iconColor: 'contentBrand',
    iconBackgroundColor: 'elementFillBrandSofter',
    iconBorderColor: 'elementBorderBrandSofter',
} as const;

export const TimelineDetailsCardItemIcon = ({ index }: TimelineDetailsCardItemIconProps) => (
    <IconSquare icon={index + 1} {...defaultItemIconProps} />
);

TimelineDetailsCardItemIcon.displayName = 'TimelineDetailsCardItemIcon';
