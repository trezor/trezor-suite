import { Translation } from '@suite/intl';
import { type AccountKey } from '@suite-common/wallet-types';

import { coinjoinAccountUpdateMaxMiningFee } from 'src/actions/wallet/coinjoinAccountActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectDefaultMaxMiningFeeByAccountKey,
    selectFeeRateMedianByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';

import { SetupSlider } from './SetupSlider/SetupSlider';
import {
    GRADIENT_SLIDER_GREEN_END,
    GRADIENT_SLIDER_GREEN_START,
    GRADIENT_SLIDER_RED_END,
    GRADIENT_SLIDER_YELLOW_END,
    GRADIENT_SLIDER_YELLOW_START,
} from './consts';

const min = 1;
const max = 500;
const unit = 'sat/vB';
const labels = [min, max / 2, max].map(number => ({
    value: `${number} ${unit}`,
    max,
}));

const getPercentage = (value: number) => ((value - min) / (max - min)) * 100;

interface MaxMiningFeeSetupProps {
    accountKey: AccountKey;
    maxMiningFee: number;
}

export const MaxMiningFeeSetup = ({ accountKey, maxMiningFee }: MaxMiningFeeSetupProps) => {
    const feeRateMedian = useSelector(state => selectFeeRateMedianByAccountKey(state, accountKey));
    const defaultMaxMiningFee = useSelector(state =>
        selectDefaultMaxMiningFeeByAccountKey(state, accountKey),
    );

    const dispatch = useDispatch();

    const updateMaxMiningFee = (value: number) => {
        dispatch(coinjoinAccountUpdateMaxMiningFee(accountKey, value));
    };

    const feeRateMedianPercentage = getPercentage(feeRateMedian);
    const defaultMaxMiningFeePercentage = getPercentage(defaultMaxMiningFee);

    const trackStyle = {
        background: `\
            linear-gradient(90deg,\
                ${GRADIENT_SLIDER_RED_END} 0%,\
                ${GRADIENT_SLIDER_YELLOW_END} ${feeRateMedianPercentage / 1.1}%,\
                ${GRADIENT_SLIDER_YELLOW_START} ${feeRateMedianPercentage}%,\
                ${GRADIENT_SLIDER_GREEN_END} ${defaultMaxMiningFeePercentage}%,\
                ${GRADIENT_SLIDER_GREEN_START} 100%\
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
            inputWidth={112}
            trackStyle={trackStyle}
            labels={labels}
        />
    );
};
