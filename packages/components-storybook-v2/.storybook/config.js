import { addParameters, addDecorator, configure } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';
import { withKnobs } from '@storybook/addon-knobs';

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

const loadStories = () => {
    import('../src/stories/components/buttons/all');
    import('../src/stories/components/buttons/button');
    import('../src/stories/components/form/all');
    import('../src/stories/components/form/input');
    import('../src/stories/components/form/checkbox');
    import('../src/stories/components/form/switch');
    import('../src/stories/components/form/textarea');
    import('../src/stories/components/form/select');
    import('../src/stories/components/icons/all');
    import('../src/stories/components/icons/icon');
    import('../src/stories/components/logos/all');
    import('../src/stories/components/logos/coin');
    import('../src/stories/components/logos/trezor');
    import('../src/stories/components/typography/all');
    import('../src/stories/components/typography/heading');
    import('../src/stories/components/typography/paragraph');
    import('../src/stories/components/typography/link');
    import('../src/stories/components/notifications/all');
    import('../src/stories/components/notifications/notification');
    import('../src/stories/components/modal/modal');
    import('../src/stories/components/loaders/all');
    import('../src/stories/components/loaders/loader');
    import('../src/stories/components/tooltip/all');
    import('../src/stories/components/tooltip/tooltip');
};

configure(loadStories, module);
