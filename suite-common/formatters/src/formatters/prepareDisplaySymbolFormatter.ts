import { type UNIT_ABBREVIATION, UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import {
    type NetworkDisplaySymbol,
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';

import { makeFormatter } from '../makeFormatter';
import { type FormatterConfig } from '../types';

export type DisplaySymbolFormatterDataContext = { areAmountUnitsEnabled?: boolean };

type FormattedNetworkDisplaySymbol =
    | NetworkDisplaySymbol
    | UNIT_ABBREVIATION
    | `${UNIT_ABBREVIATION} ${NetworkDisplaySymbol}`;

export const prepareDisplaySymbolFormatter = (config: FormatterConfig) =>
    makeFormatter<NetworkSymbol, string, DisplaySymbolFormatterDataContext>(
        (symbol, dataContext) => {
            const { bitcoinAmountUnit } = config;
            const { areAmountUnitsEnabled = true } = dataContext;

            const { features: networkFeatures, testnet: isTestnet } = getNetwork(symbol);
            const areAmountUnitsSupported = !!networkFeatures?.includes('amount-unit');
            let formattedSymbol: FormattedNetworkDisplaySymbol = getNetworkDisplaySymbol(symbol);

            // convert to different units if needed
            if (areAmountUnitsEnabled && areAmountUnitsSupported) {
                const unitAbbreviation = UNIT_ABBREVIATIONS[bitcoinAmountUnit];
                formattedSymbol = isTestnet
                    ? `${unitAbbreviation} ${formattedSymbol}`
                    : unitAbbreviation;
            }

            return formattedSymbol;
        },
        'DisplaySymbolFormatter',
    );
