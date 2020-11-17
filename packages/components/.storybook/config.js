import React from 'react';
import { addParameters, addDecorator, configure } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { StoryWrapper } from '../src/support/Story';

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
addDecorator(StoryWrapper);

const loadStories = () => {
    const req = require.context('../src/components', true, /^.*\.stories\.tsx?$/);
    req.keys().forEach(filename => req(filename));
};

configure(loadStories, module);
