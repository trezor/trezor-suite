import { Locator, Page } from '@playwright/test';

export class ConnectPermissionsModal {
    readonly loadingHeader: Locator;
    readonly appName: Locator;
    readonly processParagraph: Locator;
    readonly rememberCheckbox: Locator;
    readonly silentModeCheckbox: Locator;
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;
    /** Lowercase `CoinSymbol` (`btc`), or `device` for the coin-less group. */
    readonly permissionGroup: (coin: string) => Locator;
    /** `permission` as used in code (`read_address`); the testID dash-cases it. */
    readonly groupPermission: (coin: string, permission: string) => Locator;

    constructor(page: Page) {
        this.loadingHeader = page
            .getByTestId('@connect-popup-loading')
            .getByTestId('@modal/header');
        this.appName = page.getByTestId('@connect-permissions-modal/app-name');
        this.processParagraph = page.getByTestId('@connect-permissions-modal/paragraph-process');
        this.rememberCheckbox = page.getByTestId('@connect-permissions-modal/remember-checkbox');
        this.silentModeCheckbox = page.getByTestId(
            '@connect-permissions-modal/silent-mode-checkbox',
        );
        this.confirmButton = page.getByTestId('@connect-permissions-modal/confirm-button');
        this.cancelButton = page.getByTestId('@connect-permissions-modal/cancel-button');
        this.permissionGroup = coin => page.getByTestId(`@connect-permissions/group/${coin}`);
        this.groupPermission = (coin, permission) =>
            this.permissionGroup(coin).getByTestId(
                `@connect-permissions/permission/${permission.replace(/_/g, '-')}`,
            );
    }
}
