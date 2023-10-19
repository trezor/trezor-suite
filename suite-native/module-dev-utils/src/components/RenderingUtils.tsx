import { useDebugView } from '@suite-native/atoms';

import { DevCheckBoxListItem } from './DevCheckBoxListItem';

export const RenderingUtils = () => {
    const {
        toggleFlashOnRerender,
        toggleRerenderCount,
        isFlashOnRerenderEnabled,
        isRerenderCountEnabled,
    } = useDebugView();

    return (
        <>
            <DevCheckBoxListItem
                title="Flash on rerender"
                onPress={toggleFlashOnRerender}
                isChecked={isFlashOnRerenderEnabled}
            />
            <DevCheckBoxListItem
                title="Show rerender count"
                onPress={toggleRerenderCount}
                isChecked={isRerenderCountEnabled}
            />
        </>
    );
};
