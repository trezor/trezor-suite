import * as suiteActions from '@suite-actions/suiteActions';
import { useActions, useSelector } from '@suite-hooks';
import { getThemeColors } from '@suite-utils/theme';
import { SuiteThemeColors } from '@suite-types';

export const useTheme = () => {
    const themeObj = useSelector(state => state.suite.settings.theme);
    const { setTheme } = useActions({
        setTheme: suiteActions.setTheme,
    });

    const theme = getThemeColors(themeObj);
    const themeVariant = themeObj.variant;

    return {
        theme,
        themeVariant,
        setTheme,
    };
};

export type { SuiteThemeColors };
