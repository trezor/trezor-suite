import { IconName } from '@trezor/icons';

export type TabsOptions = {
    [routeName: string]: {
        routeName: string;
        iconName: IconName;
        label?: string;
        isActionTabItem?: boolean;
        params?: Record<string, unknown>;
    };
};
