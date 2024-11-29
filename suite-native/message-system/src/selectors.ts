import { createMemoizedSelector, selectActiveFeatureMessages } from '@suite-common/message-system';

export const selectActiveKillswitchMessages = createMemoizedSelector(
    [selectActiveFeatureMessages],
    messages =>
        messages.filter(
            m => m.feature?.filter(item => item.domain === 'killswitch' && item.flag) ?? false,
        ),
);
