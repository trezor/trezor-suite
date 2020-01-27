import React from 'react';
import { addParameters, addDecorator, configure } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { StoryWrapper } from '../src/components/Story';

addParameters({
    options: {
        showPanel: true,
        showInfo: true,
        panelPosition: 'right',
    },
    info: {
        disable: true,
    },
    theme: {
        base: 'light',
    },
});

addDecorator(withInfo);
addDecorator(withKnobs);

addDecorator(storyFn => <StoryWrapper>{storyFn()}</StoryWrapper>);

const loadStories = () => {
    require('../src/stories/buttons/all');
    require('../src/stories/buttons/button');
    require('../src/stories/form/all');
    require('../src/stories/form/input');
    require('../src/stories/form/checkbox');
    require('../src/stories/form/switch');
    require('../src/stories/form/textarea');
    require('../src/stories/form/select');
    require('../src/stories/icons/all');
    require('../src/stories/icons/icon');
    require('../src/stories/logos/all');
    require('../src/stories/logos/coin');
    require('../src/stories/logos/trezor');
    require('../src/stories/typography/all');
    require('../src/stories/typography/heading');
    require('../src/stories/typography/paragraph');
    require('../src/stories/typography/link');
    require('../src/stories/notifications/all');
    require('../src/stories/notifications/notification');
    require('../src/stories/modal/modal');
    require('../src/stories/loaders/all');
    require('../src/stories/loaders/loader');
    require('../src/stories/tooltip/all');
    require('../src/stories/tooltip/tooltip');
};

configure(loadStories, module);
