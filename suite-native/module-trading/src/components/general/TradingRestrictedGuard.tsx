import { type ReactElement } from 'react';
import { useSelector } from 'react-redux';

import {
    Feature,
    type MessageSystemRootState,
    selectFeatureMessageContent,
} from '@suite-common/message-system';
import { selectIsFinpromRestricted } from '@suite-native/finprom';
import { Translation, selectLocale } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { WarningCard } from '@suite-native/trading-atoms';

export type TradingRestrictedGuardProps = {
    children: ReactElement;
};

export const TradingRestrictedGuard = ({ children }: TradingRestrictedGuardProps) => {
    const isFinpromRestricted = useSelector(selectIsFinpromRestricted);
    const locale = useSelector(selectLocale);
    const content = useSelector((state: MessageSystemRootState) =>
        selectFeatureMessageContent(state, Feature.finprom.presenceRestriction, locale),
    );

    if (isFinpromRestricted) {
        return (
            <Screen header={<ScreenHeader closeActionType="back" />}>
                <WarningCard
                    title={
                        content ? content : <Translation id="tradingAtoms.error.restrictedTitle" />
                    }
                />
            </Screen>
        );
    }

    return children;
};
