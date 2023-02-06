import { makeFormatter } from '../makeFormatter';

export const MonthNameFormatter = makeFormatter<Date, string>(value => {
    // Note - formatter expects YYYY-MM in human readable format (e.g. 2022-03 equals March 2022), which we need to shift to make it JS readable.
    value.setMonth(value.getMonth() + 1);

    const monthName = value.toLocaleDateString('en-us', {
        month: 'long',
    });
    console.log(monthName);
    return monthName;
});
