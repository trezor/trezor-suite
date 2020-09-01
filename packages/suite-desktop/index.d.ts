import { DesktopApi } from '@trezor/suite/index.d';

export {};
declare global {
    interface Window {
        desktop_api: DesktopApi;
    }
}
