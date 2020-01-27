import React from 'react';
import { addParameters, addDecorator, configure } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { StoryWrapper } from '../src/components/Story';

addParameters({
    options: {
        showPanel: true,
        showInfo: false,
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
    require('../src/stories/components/buttons/all');
    require('../src/stories/components/buttons/button');
    require('../src/stories/components/form/all');
    require('../src/stories/components/form/input');
    require('../src/stories/components/form/checkbox');
    require('../src/stories/components/form/switch');
    require('../src/stories/components/form/textarea');
    require('../src/stories/components/form/select');
    require('../src/stories/components/icons/all');
    require('../src/stories/components/icons/icon');
    require('../src/stories/components/logos/all');
    require('../src/stories/components/logos/coin');
    require('../src/stories/components/logos/trezor');
    require('../src/stories/components/typography/all');
    require('../src/stories/components/typography/heading');
    require('../src/stories/components/typography/paragraph');
    require('../src/stories/components/typography/link');
    require('../src/stories/components/notifications/all');
    require('../src/stories/components/notifications/notification');
    require('../src/stories/components/modal/modal');
    require('../src/stories/components/loaders/all');
    require('../src/stories/components/loaders/loader');
    require('../src/stories/components/tooltip/all');
    require('../src/stories/components/tooltip/tooltip');
};

configure(loadStories, module);
