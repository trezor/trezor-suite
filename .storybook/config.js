import { addDecorator, configure } from '@storybook/react';
import { withOptions } from '@storybook/addon-options';
import { withInfo } from '@storybook/addon-info';
import { configureViewport } from '@storybook/addon-viewport';
import colors from '../src/config/colors';

addDecorator(
    withOptions({
        name: 'Trezor UI Components',
        url: '#',
        addonPanelInRight: true,
        theme: {
            mainBackground: colors.BACKGROUND,
            mainBorder: `1px solid ${colors.DIVIDER}`,
            mainFill: colors.WHITE,
            barFill: colors.GRAY_LIGHT,
            mainTextFace: 'Roboto',
            mainTextColor: colors.TEXT_PRIMARY,
            layoutMargin: 10,
            treeMenuHeader: {
                color: colors.TEXT_PRIMARY,
            },
            menuLink: {
                color: colors.TEXT_SECONDARY,
            },
            activeMenuLink: {
                color: colors.GREEN_PRIMARY,
                background: 'none',
            },
            filter: {
                display: 'none'
            }
        },
    }),
);
console.log(colors);
configureViewport();

function loadStories() {
    require('stories/components/text.js');
    require('stories/components/buttons.js');
    require('stories/components/form.js');
    require('stories/components/notifications.js');
    require('stories/components/loader.js');
    require('stories/components/modal.js');
    require('stories/components/icons.js');
    require('stories/components/coins.js');
    require('stories/components/colors.js');
}

configure(loadStories, module);
