import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import { Feature, selectFeatureMessageContent } from '@suite-common/message-system';
import { Banner } from '@trezor/components';
import { WarningIcon } from '@trezor/icons';

import { PageHeader } from '../../../../components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from '../../../../hooks/suite';

export const TradingRestricted = () => {
    const language = useSelector(selectLanguage);
    const content = useSelector(state =>
        selectFeatureMessageContent(state, Feature.regions.presenceRestriction, language),
    );

    useLayout('Trezor Suite', <PageHeader />);

    return (
        <Banner
            icon={WarningIcon}
            intent="warning"
            description={content ? content : <Translation id="TR_TRADING_RESTRICTED" />}
        />
    );
};
