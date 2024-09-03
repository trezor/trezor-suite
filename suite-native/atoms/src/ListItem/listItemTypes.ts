import { ReactNode } from 'react';

import { IconName } from '@suite-common/icons-deprecated';
import { NativeStyleObject } from '@trezor/styles';

export type BaseListItem = {
    iconName?: IconName;
    title: ReactNode;
    subtitle?: ReactNode;
    onPress?: () => void;
    style?: NativeStyleObject;
    isTextTruncated?: boolean;
};
