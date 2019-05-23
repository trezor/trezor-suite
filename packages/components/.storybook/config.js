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
            mainTextSize: 14,
            treeMenuHeader: {
                color: colors.TEXT_PRIMARY,
                lineHeight: '1.4rem',
            },
            menuLink: {
                color: colors.TEXT_SECONDARY,
                fontSize: '.9rem',
                lineHeight: '1.2rem',
                marginLeft: 0,
            },
            activeMenuLink: {
                color: colors.GREEN_PRIMARY,
                background: 'none',
            },
        },
    }),
);

configureViewport();

function loadStories() {
    require('../src/stories/components/text.js');
    require('../src/stories/components/buttons.js');
    require('../src/stories/components/form.js');
    require('../src/stories/components/notifications.js');
    require('../src/stories/components/modal.js');
    require('../src/stories/components/other.js');
    require('../src/stories/components/colors.js');
}

configure(loadStories, module);
