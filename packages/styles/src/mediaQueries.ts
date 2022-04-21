export const mediaQueries = {
    // NOTE: React Testing Library thinks that buttons are inaccessible when they are hidden for print.
    print:
        process.env.NODE_ENV === 'test'
            ? '&.some-class-that-definitely-does-not-exist'
            : '@media print',
};
