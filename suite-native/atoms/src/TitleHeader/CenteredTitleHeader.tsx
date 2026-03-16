import { TitleHeader, type TitleHeaderProps } from './TitleHeader';

export const CenteredTitleHeader = ({ ...titleHeaderProps }: TitleHeaderProps) => (
    <TitleHeader {...titleHeaderProps} textAlign="center" />
);
