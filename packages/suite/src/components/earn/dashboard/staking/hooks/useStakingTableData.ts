import { useMemo } from 'react';

import { type StakingNetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
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
    const ethCurrentRate = useCryptoCurrentRate(asNetworkSymbol('eth'));
    const solCurrentRate = useCryptoCurrentRate(asNetworkSymbol('sol'));
    const adaCurrentRate = useCryptoCurrentRate(asNetworkSymbol('ada'));
    const trxCurrentRate = useCryptoCurrentRate(asNetworkSymbol('trx'));

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
        deviceSupportedNetworkSymbols.includes(asNetworkSymbol('eth')) &&
        !stakingAccounts.some(account => account.symbol === 'eth');

    const solNotActivated =
        deviceSupportedNetworkSymbols.includes(asNetworkSymbol('sol')) &&
        !stakingAccounts.some(account => account.symbol === 'sol');

    const adaNotActivated =
        deviceSupportedNetworkSymbols.includes(asNetworkSymbol('ada')) &&
        !stakingAccounts.some(account => account.symbol === 'ada');

    const trxNotActivated =
        deviceSupportedNetworkSymbols.includes(asNetworkSymbol('trx')) &&
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
