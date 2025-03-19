import { TitleHeader, TitleHeaderProps } from './TitleHeader';

export const CenteredTitleHeader = ({ ...titleHeaderProps }: TitleHeaderProps) => (
    <TitleHeader {...titleHeaderProps} textAlign="center" />
);
