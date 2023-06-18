import React from 'react';
import { Error } from 'src/components/suite/Error';
import { ThemeProvider } from '../ThemeProvider';

type ErrorScreenProps = {
    error: string;
};

export const ErrorScreen = ({ error }: ErrorScreenProps) => (
    <ThemeProvider>
        <Error error={error} />
    </ThemeProvider>
);
