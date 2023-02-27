import React from 'react';

import { Translation } from '@suite-components';
import { useDispatch, useSelector } from '@suite-hooks';
import { useTheme } from '@trezor/components';
import { coinjoinAccountUpdateMaxMiningFee } from '@wallet-actions/coinjoinAccountActions';
import { SetupSlider } from './SetupSlider';
import { MAX_MINING_FEE_FALLBACK, MAX_MINING_FEE_MODIFIER } from '@trezor/coinjoin/src/constants';
import { selectCoinjoinClient } from '@wallet-reducers/coinjoinReducer';

const min = 1;
const max = 500;
const unit = 'sat/vB';
const labels = [min, max / 2, max].map(number => ({
    value: `${number} ${unit}`,
}));

interface MaxMiningFeeSetupProps {
    accountKey: string;
    maxMiningFee: number;
}

export const MaxMiningFeeSetup = ({ accountKey, maxMiningFee }: MaxMiningFeeSetupProps) => {
    const coinjoinClient = useSelector(state => selectCoinjoinClient(state, accountKey));

    const dispatch = useDispatch();

    const theme = useTheme();

    const updateMaxMiningFee = (value: number) => {
        dispatch(coinjoinAccountUpdateMaxMiningFee(accountKey, value));
    };

    const recommendedMaxMiningFee = coinjoinClient
        ? coinjoinClient.maxMiningFee
        : MAX_MINING_FEE_FALLBACK;
    const maxMiningFeeRangePercentage = recommendedMaxMiningFee / (max / 100) + min;
    const green = maxMiningFeeRangePercentage > 100 ? 100 : maxMiningFeeRangePercentage;

    const trackStyle = {
        background: `\
            linear-gradient(90deg,\
                ${theme.GRADIENT_SLIDER_RED_END} 0%,\
                ${theme.GRADIENT_SLIDER_YELLOW_END} ${green / (MAX_MINING_FEE_MODIFIER * 1.1)}%,\
                ${theme.GRADIENT_SLIDER_YELLOW_START} ${green / MAX_MINING_FEE_MODIFIER}%,\
                ${theme.GRADIENT_SLIDER_GREEN_END} ${green}%,\
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
