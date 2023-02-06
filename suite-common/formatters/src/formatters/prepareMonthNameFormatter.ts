import { makeFormatter } from '../makeFormatter';

export const MonthNameFormatter = makeFormatter<Date, string>(value =>
    value.toLocaleDateString('en-us', {
        month: 'long',
    }),
);
