import { app, BrowserWindow } from 'electron';
import * as path from 'path';

export const buyRedirectHandler = (url: string, mainWindow: BrowserWindow, src: string) => {
    // if we are already in the buy detail page of the correct account, we do not have to redirect
    // url is in the form /coinmarket-redirect/detail/btc/normal/0/d36e9922-f522-451d-8024-fd4330ecaf6b
    // required mainWindow url to skip redirect is /accounts/trade/buy/detail/#/btc/0/normal or /accounts/trade/buy/detail/#/btc/0 for normal account
    const [, , action, coin, type, index] = url.split('/');

    if (
        !(
            action === 'detail' &&
            (mainWindow.webContents
                .getURL()
                .endsWith(`/accounts/trade/buy/detail/#/${coin}/${index}/${type}`) ||
                (mainWindow.webContents
                    .getURL()
                    .endsWith(`/accounts/trade/buy/detail/#/${coin}/${index}`) &&
                    type === 'normal') ||
                (mainWindow.webContents.getURL().endsWith(`/accounts/trade/buy/detail/`) &&
                    type === 'normal' &&
                    coin === 'btc' &&
                    index === '0'))
        )
    ) {
        mainWindow.loadURL(
            path.join(src, url.replace('#', '').replace('trade-redirect/', 'trade-redirect#')),
        );
    }

    app.focus({ steal: true });
};
