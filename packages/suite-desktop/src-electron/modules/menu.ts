import { Menu } from 'electron';

import { buildMainMenu, inputMenu, selectionMenu } from '../libs/menu';
import { b2t } from '../libs/utils';
import { Module } from '../libs/modules';

const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    Menu.setApplicationMenu(buildMainMenu());
    mainWindow.setMenuBarVisibility(false);

    mainWindow.webContents.on('context-menu', (_, props) => {
        const isTextSelected = Boolean(props.selectionText) && props.selectionText.trim() !== '';
        logger.debug('menu', [
            'Context menu:',
            `- Editable: ${b2t(props.isEditable)}`,
            `- Text Selected: ${b2t(isTextSelected)}`,
        ]);

        if (props.isEditable) {
            // right click on the input/textarea should open a context menu with text editing options (copy, cut, paste,...)
            inputMenu.popup();
        } else if (isTextSelected) {
            // right click with active text selection should open context menu with a copy option
            selectionMenu.popup();
        }
    });
};

export default init;
