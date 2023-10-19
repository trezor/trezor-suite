import { ComponentProps } from 'react';
import { FormattedDate as IntlFormattedDate } from 'react-intl';

const defaultDateFormat = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
} as const;

const defaultTimeFormat = {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
} as const;

export interface FormattedDateProps extends ComponentProps<typeof IntlFormattedDate> {
    date?: boolean;
    time?: boolean;
}

export const FormattedDate = (props: FormattedDateProps) => (
    <IntlFormattedDate
        {...(props.date ? defaultDateFormat : {})}
        {...(props.time ? defaultTimeFormat : {})}
        {...props}
    />
);
