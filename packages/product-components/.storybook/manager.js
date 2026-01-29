import { addons } from 'storybook/manager-api';

import { darkTheme, lightTheme } from './theme';

const mq = window.matchMedia('(prefers-color-scheme: dark)');

function apply() {
    addons.setConfig({ theme: mq.matches ? darkTheme : lightTheme });
}

apply();

mq.addEventListener('change', apply);
