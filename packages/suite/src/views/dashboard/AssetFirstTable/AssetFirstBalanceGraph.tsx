import { useEffect, useState } from 'react';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { useTheme } from 'styled-components';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Box } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectGraph } from 'src/reducers/wallet/graphReducer';
import { prepareGraphDataAsync } from 'src/utils/wallet/graph';

const GRAPH_WIDTH = 180;
const GRAPH_HEIGHT = 56;

type BalancePoint = {
    time: number;
    value: number;
};

/**
 * What the wallet has been worth, beside what it is worth now.
 *
 * Reads the history the dashboard graph already keeps — the middleware fills it when discovery
 * completes — and draws the line alone: no axes, ticks or tooltip, because at this size they would
 * be unreadable and the number beside it is the one being read.
 */
export const AssetFirstBalanceGraph = () => {
    const theme = useTheme();
    const graph = useSelector(selectGraph);
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    const [points, setPoints] = useState<BalancePoint[]>([]);

    useEffect(() => {
        if (graph.isLoading) {
            return;
        }

        let isCurrent = true;

        prepareGraphDataAsync({ graph, deviceState: deviceStaticSessionId ?? undefined }).then(
            data => {
                if (!isCurrent) {
                    return;
                }

                setPoints(
                    data.flatMap(point => {
                        const balance = point.balanceFiat?.[baseCurrencyCode];

                        return balance === undefined
                            ? []
                            : [{ time: point.time, value: Number(balance) }];
                    }),
                );
            },
        );

        return () => {
            isCurrent = false;
        };
    }, [graph, deviceStaticSessionId, baseCurrencyCode]);

    const first = points[0];
    const last = points[points.length - 1];

    // A single point is not a line, and an empty graph says less than no graph at all.
    if (first === undefined || last === undefined || points.length < 2) {
        return null;
    }

    const isGain = last.value >= first.value;

    return (
        <Box width={GRAPH_WIDTH} height={GRAPH_HEIGHT} data-testid="@dashboard/asset-first/graph">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={isGain ? theme.borderBrand : theme.borderCritical}
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};
