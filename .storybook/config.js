import { addDecorator, configure } from '@storybook/react';
import { withOptions } from '@storybook/addon-options';
import { withInfo } from '@storybook/addon-info';
import { configureViewport } from '@storybook/addon-viewport';

addDecorator(
    withOptions({
        name: 'Trezor UI Components',
        addonPanelInRight: true
    })
);

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
