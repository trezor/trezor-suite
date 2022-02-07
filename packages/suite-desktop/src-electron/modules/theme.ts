import { nativeTheme } from 'electron';
import { SuiteThemeVariant } from '@trezor/suite-desktop-api';
import { getThemeSettings, setThemeSettings } from '../libs/store';
import { ipcMain } from '../typed-electron';

const setThemeManually = (theme: SuiteThemeVariant) => {
    const { logger } = global;

    logger.info('theme', `Manually setting app window UI to ${theme} theme.`);

    nativeTheme.themeSource = theme;
    setThemeSettings(theme);
};

const init = () => {
    const { logger } = global;

    const theme = getThemeSettings();
    if (theme !== 'system') {
        logger.info('theme', `Setting app window UI theme to ${theme}.`);
        nativeTheme.themeSource = theme;
    }

    ipcMain.on('theme/change', (_, theme) => setThemeManually(theme));
};

export default init;
