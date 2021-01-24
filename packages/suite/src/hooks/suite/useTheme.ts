import * as suiteActions from '@suite-actions/suiteActions';
import { useActions } from '@suite-hooks/useActions';
import { useSelector } from '@suite-hooks/useSelector';
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
