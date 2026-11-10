import { Error } from '../../../components/suite/Error';
import { ThemeProvider } from '../ThemeProvider';

type ErrorScreenProps = {
    error: string;
};

export const ErrorScreen = ({ error }: ErrorScreenProps) => (
    <ThemeProvider>
        <Error error={error} />
    </ThemeProvider>
);
