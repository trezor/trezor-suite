import { type Route } from '@suite/router';

// reexport
export type {
    AcquiredDevice,
    ButtonRequest,
    ExtendedDevice,
    TrezorDevice,
    UnknownDevice,
    UnreadableDevice,
} from '@suite-common/suite-types';
export type { PrerequisiteType } from '#src/utils/suite/prerequisites';
export type { Route };

export type ForegroundAppRoute = Extract<
    Route,
    { isForegroundApp: true; isFullscreenApp: false | undefined }
>;

export type ForegroundAppProps = {
    cancelable: boolean;
    onCancel: (preserveParams?: boolean) => void;
};

export type ToastNotificationVariant = 'success' | 'info' | 'warning' | 'error' | 'transparent';

export enum DisplayMode {
    CHUNKS = 1,
    PAGINATED_TEXT,
    SINGLE_WRAPPED_TEXT,
}
