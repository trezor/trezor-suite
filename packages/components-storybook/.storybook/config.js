import { addParameters, addDecorator, configure } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';
import Theme from './theme';

addParameters({
    options: {
        theme: Theme
    }
});
addDecorator(withInfo);
addDecorator(withKnobs);

function loadStories() {
    require('../src/stories/components/text.tsx');
    require('../src/stories/components/buttons.tsx');
    require('../src/stories/components/form.tsx');
    require('../src/stories/components/notifications.tsx');
    require('../src/stories/components/modal.tsx');
    require('../src/stories/components/other.tsx');
}

configure(loadStories, module);
