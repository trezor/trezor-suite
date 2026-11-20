import { TorLoader } from '@suite/tor-desktop';
import { ThemeProvider, useTor } from '@trezor/suite';

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
