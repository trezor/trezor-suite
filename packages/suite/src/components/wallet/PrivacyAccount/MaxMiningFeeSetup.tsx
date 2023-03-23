import React from 'react';

import { Translation } from '@suite-components';
import { useDispatch, useSelector } from '@suite-hooks';
import { useTheme } from '@trezor/components';
import { coinjoinAccountUpdateMaxMiningFee } from '@wallet-actions/coinjoinAccountActions';
import { SetupSlider } from './SetupSlider';
import {
    selectDefaultMaxMiningFeeByAccountKey,
    selectWeeklyFeeRateMedianByAccountKey,
} from '@wallet-reducers/coinjoinReducer';

const min = 1;
const max = 500;
const unit = 'sat/vB';
const labels = [min, max / 2, max].map(number => ({
    value: `${number} ${unit}`,
}));

const getPercentage = (value: number) => ((value - min) / (max - min)) * 100;

interface MaxMiningFeeSetupProps {
    accountKey: string;
    maxMiningFee: number;
}

export const MaxMiningFeeSetup = ({ accountKey, maxMiningFee }: MaxMiningFeeSetupProps) => {
    const weeklyFeeRateMedian = useSelector(state =>
        selectWeeklyFeeRateMedianByAccountKey(state, accountKey),
    );
    const defaultMaxMiningFee = useSelector(state =>
        selectDefaultMaxMiningFeeByAccountKey(state, accountKey),
    );

    const dispatch = useDispatch();

    const theme = useTheme();

    const updateMaxMiningFee = (value: number) => {
        dispatch(coinjoinAccountUpdateMaxMiningFee(accountKey, value));
    };

    const weeklyFeeRateMedianPercentage = getPercentage(weeklyFeeRateMedian);
    const defaultMaxMiningFeePercentage = getPercentage(defaultMaxMiningFee);

    const trackStyle = {
        background: `\
            linear-gradient(90deg,\
                ${theme.GRADIENT_SLIDER_RED_END} 0%,\
                ${theme.GRADIENT_SLIDER_YELLOW_END} ${weeklyFeeRateMedianPercentage / 1.1}%,\
                ${theme.GRADIENT_SLIDER_YELLOW_START} ${weeklyFeeRateMedianPercentage}%,\
                ${theme.GRADIENT_SLIDER_GREEN_END} ${defaultMaxMiningFeePercentage}%,\
                ${theme.GRADIENT_SLIDER_GREEN_START} 100%\
            );`,
    };

    return (
        <SetupSlider
            heading={<Translation id="TR_MAX_MINING_FEE" />}
            description={<Translation id="TR_MINING_FEE_NOTE" />}
            onChange={updateMaxMiningFee}
            value={maxMiningFee}
            min={min}
            max={max}
            unit={unit}
            inputWidth={116}
            trackStyle={trackStyle}
            labels={labels}
        />
    );
};
