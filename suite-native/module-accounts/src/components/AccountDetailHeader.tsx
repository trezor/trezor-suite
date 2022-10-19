import React, { memo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Graph, TimeSwitch } from '@suite-native/graph';
import { AccountBalance } from '@suite-native/accounts';
import { Box, Text } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/suite-types';
import {
    getSingleAccountGraphPointsThunk,
    LineGraphTimeFrameValues,
    selectAccountGraphPoints,
} from '@suite-common/wallet-graph';
import { selectFiatCurrency } from '@suite-native/module-settings';

type AccountDetailHeaderProps = {
    accountKey: AccountKey;
    accountName?: string;
};

export const AccountDetailHeader = memo(({ accountKey, accountName }: AccountDetailHeaderProps) => {
    const dispatch = useDispatch();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const graphPoints = useSelector(selectAccountGraphPoints);
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<LineGraphTimeFrameValues>('day');

    useEffect(() => {
        dispatch(
            getSingleAccountGraphPointsThunk({
                accountKey,
                fiatCurrency: fiatCurrency.label,
                timeFrame: selectedTimeFrame,
            }),
        );
    }, [selectedTimeFrame, fiatCurrency, accountKey, dispatch]);

    const handleSelectTimeFrame = (timeFrame: LineGraphTimeFrameValues) => {
        setSelectedTimeFrame(timeFrame);
    };

    return (
        <>
            <AccountBalance accountKey={accountKey} accountName={accountName} />
            <Graph points={graphPoints} />
            <TimeSwitch
                selectedTimeFrame={selectedTimeFrame}
                onSelectTimeFrame={handleSelectTimeFrame}
            />
            <Box marginBottom="large">
                <Text variant="titleSmall">Transactions</Text>
            </Box>
        </>
    );
});
