import { useTranslation } from '@suite/intl';
import { EarnPositions, PageHeader, useLayout } from '@trezor/suite';

export const EarnPositionsPage = () => {
    const { translationString } = useTranslation();
    const pageHeader = <PageHeader />;

    useLayout(translationString('TR_EARN_MY_POSITIONS'), pageHeader);

    return <EarnPositions />;
};
