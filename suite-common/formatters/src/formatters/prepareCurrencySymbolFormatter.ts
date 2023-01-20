import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { getNetwork } from '@suite-common/wallet-utils';

import { FormatterConfig } from '../types';
import { makeFormatter } from '../makeFormatter';

export const prepareCurrencySymbolFormatter = (config: FormatterConfig) =>
    makeFormatter<NetworkSymbol, string>(symbol => {
        const { bitcoinAmountUnit } = config;

        const { features: networkFeatures, testnet: isTestnet } = getNetwork(symbol) ?? {};
        const areAmountUnitsSupported = !!networkFeatures?.includes('amount-unit');

        let formattedSymbol = symbol.toUpperCase();

        // convert to different units if needed
        if (areAmountUnitsSupported) {
            const unitAbbreviation = UNIT_ABBREVIATIONS[bitcoinAmountUnit];
            formattedSymbol = isTestnet
                ? `${unitAbbreviation} ${symbol.toUpperCase()}`
                : unitAbbreviation;
        }

        return formattedSymbol;
    });
