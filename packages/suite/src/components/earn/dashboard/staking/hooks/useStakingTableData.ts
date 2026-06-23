import { useMemo } from 'react';

import { type StakingNetworkSymbol } from '@suite-common/wallet-config';
import {
    selectDeviceSupportedNetworks,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

import { useCryptoCurrentRate } from './useCryptoCurrencyRate';
import { useStakingAccountsVisibility } from './useStakingAccountsVisibility';

type UseStakingTableDataResult = {
    displayedAccounts: Account[];
    ethNotActivated: boolean;
    adaNotActivated: boolean;
    solNotActivated: boolean;
    trxNotActivated: boolean;
    isExpandable: boolean;
    isExpanded: boolean;
    toggleExpanded: () => void;
    hasAnyRewardsData: boolean;
};

export const useStakingTableData = (): UseStakingTableDataResult => {
    const ethCurrentRate = useCryptoCurrentRate('eth');
    const solCurrentRate = useCryptoCurrentRate('sol');
    const adaCurrentRate = useCryptoCurrentRate('ada');
    const trxCurrentRate = useCryptoCurrentRate('trx');

    const currentRates: Record<StakingNetworkSymbol, number | undefined> = useMemo(
        () => ({
            eth: ethCurrentRate,
            sol: solCurrentRate,
            ada: adaCurrentRate,
            thod: ethCurrentRate,
            dsol: solCurrentRate,
            trx: trxCurrentRate,
        }),
        [ethCurrentRate, solCurrentRate, adaCurrentRate, trxCurrentRate],
    );

    const accounts = useSelector(selectVisibleDeviceAccounts);

    const stakingAccounts = accounts.filter(
        account =>
            account.symbol === 'eth' ||
            account.symbol === 'sol' ||
            account.symbol === 'ada' ||
            account.symbol === 'trx',
    );

    const deviceSupportedNetworkSymbols = useSelector(selectDeviceSupportedNetworks);

    const ethNotActivated =
        deviceSupportedNetworkSymbols.includes('eth') &&
        !stakingAccounts.some(account => account.symbol === 'eth');

    const solNotActivated =
        deviceSupportedNetworkSymbols.includes('sol') &&
        !stakingAccounts.some(account => account.symbol === 'sol');

    const adaNotActivated =
        deviceSupportedNetworkSymbols.includes('ada') &&
        !stakingAccounts.some(account => account.symbol === 'ada');

    const trxNotActivated =
        deviceSupportedNetworkSymbols.includes('trx') &&
        !stakingAccounts.some(account => account.symbol === 'trx');

    const { displayedAccounts, isExpandable, isExpanded, toggleExpanded, hasAnyRewardsData } =
        useStakingAccountsVisibility({
            stakingAccounts,
            currentRates,
            ethNotActivated,
            solNotActivated,
            adaNotActivated,
            trxNotActivated,
        });

    return {
        displayedAccounts,
        ethNotActivated,
        adaNotActivated,
        solNotActivated,
        trxNotActivated,
        isExpandable,
        isExpanded,
        toggleExpanded,
        hasAnyRewardsData,
    };
};
