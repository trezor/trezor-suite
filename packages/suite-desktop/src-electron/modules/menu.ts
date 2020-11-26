import { BrowserWindow, Menu } from 'electron';

import { buildMainMenu } from '@lib/menu';

const init = (window: BrowserWindow) => {
    Menu.setApplicationMenu(buildMainMenu());
    window.setMenuBarVisibility(false);
};

export default init;
