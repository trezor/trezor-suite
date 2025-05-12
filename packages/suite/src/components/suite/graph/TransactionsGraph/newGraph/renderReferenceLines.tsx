import { ReferenceLine } from 'recharts';
import { useFormatters } from '@suite-common/formatters';
import { DefaultTheme, useTheme } from 'styled-components';
import { MetaData } from './types';

export const ReferenceLabel = props => {
    const { FiatAmountFormatter } = useFormatters();
    const { value, textAnchor, fontSize, viewBox, dy, dx, localCurrency, symbol } = props;
    const x = 15;
    const y = viewBox.y + 3;
    const theme = useTheme();

    return (
        <text
            x={x}
            y={y}
            dy={dy}
            dx={dx}
            fill={theme.textSubdued}
            fontSize={fontSize || 10}
            textAnchor={textAnchor}
        >
            {symbol}{' '}
            <FiatAmountFormatter
                value={value.toFixed()}
                currency={localCurrency}
                minimumFractionDigits={0}
            />
        </text>
    );
};

type RenderReferenceLinesProps = {
    metaData: MetaData;
    theme: DefaultTheme;
    localCurrency: string;
};

export const renderReferenceLines = ({
    metaData,
    theme,
    localCurrency,
}: RenderReferenceLinesProps) => {
    return (
        <>
            {metaData.min && (
                <ReferenceLine
                    y={metaData.min}
                    stroke={theme.backgroundNeutralSubdued}
                    strokeDasharray="1 2"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                    label={
                        <ReferenceLabel
                            symbol="▼"
                            value={metaData.min}
                            localCurrency={localCurrency}
                        />
                    }
                />
            )}
            {metaData.max && (
                <ReferenceLine
                    y={metaData.max}
                    stroke={theme.backgroundNeutralSubdued}
                    strokeDasharray="1 2"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                    label={
                        <ReferenceLabel
                            symbol="▲"
                            value={metaData.max}
                            localCurrency={localCurrency}
                        />
                    }
                />
            )}
            {metaData.average && (
                <ReferenceLine
                    y={metaData.average}
                    stroke={theme.backgroundNeutralSubdued}
                    strokeDasharray="1 2"
                    strokeWidth={1}
                    ifOverflow="extendDomain"
                    label={
                        <ReferenceLabel
                            symbol="⌀"
                            value={metaData.average}
                            localCurrency={localCurrency}
                        />
                    }
                />
            )}
        </>
    );
};
