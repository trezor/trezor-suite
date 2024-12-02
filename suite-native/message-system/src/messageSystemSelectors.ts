import { A } from '@mobily/ts-belt';

import { createMemoizedSelector, selectActiveFeatureMessages } from '@suite-common/message-system';

export const selectActiveKillswitchMessage = createMemoizedSelector(
    [selectActiveFeatureMessages],
    messages =>
        A.head(
            messages.filter(m => {
                const killswitchFeatures = m.feature?.filter(
                    item => item.domain === 'killswitch' && item?.flag,
                );

                return A.isNotEmpty(killswitchFeatures ?? []);
            }),
        ),
);
