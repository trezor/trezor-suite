import { BrowserWindow, Menu } from 'electron';

import { buildMainMenu, inputMenu, selectionMenu } from '@lib/menu';

const init = (window: BrowserWindow) => {
    Menu.setApplicationMenu(buildMainMenu());
    window.setMenuBarVisibility(false);

    window.webContents.on('context-menu', (_e, props) => {
        if (props.isEditable) {
            // right click on the input/textarea should open a context menu with text editing options (copy, cut, paste,...)
            inputMenu.popup();
        } else if (props.selectionText && props.selectionText.trim() !== '') {
            // right click with active text selection should open context menu with a copy option
            selectionMenu.popup();
        }
    });
};

export default init;
