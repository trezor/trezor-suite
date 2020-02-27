import React from 'react';
import { addParameters, addDecorator, configure } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import { StoryWrapper } from '../src/stories/components/Story';

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
    const req = require.context('../src/stories', true, /^.*\.tsx?$/);
    req.keys().forEach(filename => req(filename));
};

configure(loadStories, module);
