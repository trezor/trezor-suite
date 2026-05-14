import { useMemo } from 'react';

import { useTranslation } from '@suite/intl';
import { selectAutodetectTheme, selectTheme } from '@suite/settings';
import { selectAllAccountsToList } from '@suite-common/wallet-core';

import { useDefaultAccountLabel, useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsBioAuthEnabled } from 'src/reducers/bioAuth';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { getAccountCommands } from './commands/accountCommands';
import { getActionCommands } from './commands/actionCommands';
import { getNavigationCommands } from './commands/navigationCommands';
import { getSettingsCommands } from './commands/settingsCommands';
import { type Command } from './commands/types';

export const useCommandRegistry = (): Command[] => {
    const dispatch = useDispatch();
    const { translationString } = useTranslation();

    const selectedAccount = useSelector(selectSelectedAccount);
    const accounts = useSelector(selectAllAccountsToList);
    const currentTheme = useSelector(selectTheme);
    const autodetectTheme = useSelector(selectAutodetectTheme);
    const isBioAuthEnabled = useSelector(selectIsBioAuthEnabled);

    const { getDefaultAccountLabel } = useDefaultAccountLabel();

    return useMemo(() => {
        const navigationCommands = getNavigationCommands({ dispatch, selectedAccount });
        const settingsCommands = getSettingsCommands(dispatch);
        const accountCommands = getAccountCommands({
            dispatch,
            accounts,
            getDefaultAccountLabel,
        });
        const actionCommands = getActionCommands({
            dispatch,
            currentTheme,
            autodetectTheme,
            isBioAuthEnabled,
            translationString,
        });

        const allCommands = [
            ...navigationCommands,
            ...settingsCommands,
            ...accountCommands,
            ...actionCommands,
        ];

        return allCommands.filter(cmd => cmd.isAvailable !== false);
    }, [
        dispatch,
        selectedAccount,
        accounts,
        currentTheme,
        autodetectTheme,
        isBioAuthEnabled,
        translationString,
        getDefaultAccountLabel,
    ]);
};
