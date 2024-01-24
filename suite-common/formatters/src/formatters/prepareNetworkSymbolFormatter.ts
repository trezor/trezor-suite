import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { networksCompatibility as NETWORKS, NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterConfig } from '../types';
import { makeFormatter } from '../makeFormatter';

export type NetworkSymbolFormatterDataContext = { areAmountUnitsEnabled?: boolean };

export const prepareNetworkSymbolFormatter = (config: FormatterConfig) =>
    makeFormatter<NetworkSymbol, string, NetworkSymbolFormatterDataContext>(
        (symbol, dataContext) => {
            const { bitcoinAmountUnit } = config;
            const { areAmountUnitsEnabled = true } = dataContext;

            const { features: networkFeatures, testnet: isTestnet } =
                NETWORKS.find(network => network.symbol === symbol) ?? {};
            const areAmountUnitsSupported = !!networkFeatures?.includes('amount-unit');
            let formattedSymbol = symbol.toUpperCase();

            // convert to different units if needed
            if (areAmountUnitsEnabled && areAmountUnitsSupported) {
                const unitAbbreviation = UNIT_ABBREVIATIONS[bitcoinAmountUnit];
                formattedSymbol = isTestnet
                    ? `${unitAbbreviation} ${symbol.toUpperCase()}`
                    : unitAbbreviation;
            }

            return formattedSymbol;
        },
        'NetworkSymbolFormatter',
    );
