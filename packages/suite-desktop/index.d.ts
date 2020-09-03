import { DesktopApi } from '@trezor/suite/index.d';

declare global {
    interface Window {
        desktop_api: DesktopApi;
    }
}
