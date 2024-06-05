import { TitleHeader, TitleHeaderProps } from './TitleHeader';

export const CenteredTitleHeader = ({
    title,
    subtitle,
    titleVariant = 'titleSmall',
}: TitleHeaderProps) => {
    return (
        <TitleHeader
            titleVariant={titleVariant}
            title={title}
            subtitle={subtitle}
            textAlign="center"
        />
    );
};
