import { configure } from '@storybook/react';

function loadStories() {
    require('stories/index.js');
    require('stories/components/text.js');
    require('stories/components/buttons.js');
    require('stories/components/loader.js');
    require('stories/components/modal.js');
    require('stories/components/icons.js');
    require('stories/components/images.js');
    // You can require as many stories as you need.
}

configure(loadStories, module);
