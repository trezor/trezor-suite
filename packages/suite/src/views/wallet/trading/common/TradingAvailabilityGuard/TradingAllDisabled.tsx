import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import {
    type MessageSystemRootState,
    selectAllTradingDisabledMessageContent,
} from '@suite-common/message-system';

import { TradingUnavailableCard } from './TradingUnavailableCard';

export const TradingAllDisabled = () => {
    const language = useSelector(selectLanguage);
    const content = useSelector((state: MessageSystemRootState) =>
        selectAllTradingDisabledMessageContent(state, language),
    );

    return (
        <TradingUnavailableCard
            data-testid="@trading/all-disabled"
            title={<Translation id="TR_TRADING_ALL_DISABLED_TITLE" />}
            description={content ?? <Translation id="TR_TRADING_ALL_DISABLED_DESCRIPTION" />}
        />
    );
};
