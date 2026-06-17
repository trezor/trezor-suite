import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectAreFeesLoading,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { calculateTronFeeBreakdown } from '@suite-common/wallet-utils';
import { useTranslate } from '@suite-native/intl';

import { selectFeeLevels } from '../../selectors';
import { type NativeSendRootState } from '../../sendFormSlice';

type UseTronFeeBreakdownParams = {
    accountKey: AccountKey;
    feeLimitSunOverride?: string;
};

export const useTronFeeBreakdown = ({
    accountKey,
    feeLimitSunOverride,
}: UseTronFeeBreakdownParams) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector((state: NativeSendRootState) => selectFeeLevels(state));
    const areFeesLoading = useSelector((state: FeesRootState) =>
        selectAreFeesLoading(state, account?.symbol),
    );
    const { translate } = useTranslate();

    if (account?.networkType !== 'tron') return null;

    const breakdown = calculateTronFeeBreakdown(
        feeLevels.normal,
        account.misc?.tronResources,
        account.symbol,
        feeLimitSunOverride,
    );

    const trxBurned =
        breakdown !== null && !breakdown.trxBurned.isZero() ? breakdown.trxBurned.toString() : null;

    const resourceParts: string[] = [];
    if (breakdown?.coveredEnergy.gt(0)) {
        resourceParts.push(
            translate('moduleSend.fees.tron.energyCount', {
                count: breakdown.coveredEnergy.toFixed(0),
            }),
        );
    }
    if (breakdown?.coveredBandwidth.gt(0)) {
        resourceParts.push(
            translate('moduleSend.fees.tron.bandwidthCount', {
                count: breakdown.coveredBandwidth.toFixed(0),
            }),
        );
    }
    const resourceLabel = resourceParts.join(' & ');

    return {
        symbol: account.symbol,
        networkType: account.networkType,
        trxBurned,
        areFeesLoading,
        resourceLabel,
    };
};
