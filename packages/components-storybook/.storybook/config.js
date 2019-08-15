import { addParameters, configure } from '@storybook/react';
import Theme from './theme';

addParameters({
    options: {
        theme: Theme
    }
});

function loadStories() {
    require('../src/stories/components/text.tsx');
    require('../src/stories/components/buttons.tsx');
    require('../src/stories/components/form.tsx');
    require('../src/stories/components/notifications.tsx');
    require('../src/stories/components/modal.tsx');
    require('../src/stories/components/other.tsx');
    require('../src/stories/components/colors.tsx');
}

configure(loadStories, module);
