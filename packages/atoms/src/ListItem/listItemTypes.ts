import { IconType } from '../Icon/iconTypes';
import { NativeStyleObject } from '@trezor/styles';

export type BaseListItem = {
    iconType?: IconType;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    style?: NativeStyleObject;
    isTextTruncated?: boolean;
};
