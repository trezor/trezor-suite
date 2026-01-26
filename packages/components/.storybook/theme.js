import { create } from 'storybook/theming/create';

const common = {
    fontBase: 'TT Satoshi',
    brandTitle: 'Design System',
};

export const lightTheme = create({
    ...common,
    base: 'light',
});

export const darkTheme = create({
    ...common,
    base: 'dark',
});
