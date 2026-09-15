import { TorLoader } from '@suite/tor-desktop';

import { ThemeProvider } from 'src/support/suite/ThemeProvider';
import { useTor } from 'src/support/suite/useTor';

type TorLoadingScreenProps = {
    callback: (value?: unknown) => void;
};

export const TorLoadingScreen = ({ callback }: TorLoadingScreenProps) => {
    useTor();

    return (
        <ThemeProvider>
            <div data-testid="@tor-loading-screen">
                <TorLoader callback={callback} />
            </div>
        </ThemeProvider>
    );
};
