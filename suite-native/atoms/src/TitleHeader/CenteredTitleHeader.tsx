import type { TitleHeaderProps } from './TitleHeader';
import { TitleHeader } from './TitleHeader';

export const CenteredTitleHeader = ({ ...titleHeaderProps }: TitleHeaderProps) => (
    <TitleHeader {...titleHeaderProps} textAlign="center" />
);
