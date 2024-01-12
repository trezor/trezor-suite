export const mediaQueries = {
    // NOTE: React Testing Library thinks that buttons are inaccessible when they are hidden for print.
    print:
        process.env.NODE_ENV === 'test'
            ? '&.some-class-that-definitely-does-not-exist'
            : '@media print',
    touch: '@media (hover: none)',
    hover: '@media (hover: hover)',
    dark_theme: '@media (prefers-color-scheme: dark)', // Todo: remove this query as it shall be done via Theme
};
