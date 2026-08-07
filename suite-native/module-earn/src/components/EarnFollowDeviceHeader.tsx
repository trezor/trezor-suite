import { type ReactNode } from 'react';

import { Box } from '@suite-native/atoms';
import { GoBackIcon } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const HEADER_MIN_HEIGHT = 40;

const headerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: utils.spacings.sp8,
    paddingTop: utils.spacings.sp8,
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillPage,
    minHeight: HEADER_MIN_HEIGHT,
}));

type EarnFollowDeviceHeaderProps = {
    onClose: () => void;
    timer?: ReactNode;
};

export const EarnFollowDeviceHeader = ({ onClose, timer }: EarnFollowDeviceHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(headerStyle)}>
            <GoBackIcon
                closeActionType="back"
                closeAction={onClose}
                testID="@screen/sub-header/go-back-button"
            />
            {timer}
        </Box>
    );
};
