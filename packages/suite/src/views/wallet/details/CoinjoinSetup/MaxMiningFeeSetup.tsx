import { useTheme } from 'styled-components';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { coinjoinAccountUpdateMaxMiningFee } from 'src/actions/wallet/coinjoinAccountActions';
import { SetupSlider } from './SetupSlider/SetupSlider';
import {
    selectDefaultMaxMiningFeeByAccountKey,
    selectFeeRateMedianByAccountKey,
} from 'src/reducers/wallet/coinjoinReducer';

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
    const feeRateMedian = useSelector(state => selectFeeRateMedianByAccountKey(state, accountKey));
    const defaultMaxMiningFee = useSelector(state =>
        selectDefaultMaxMiningFeeByAccountKey(state, accountKey),
    );

    const dispatch = useDispatch();

    const theme = useTheme();

    const updateMaxMiningFee = (value: number) => {
        dispatch(coinjoinAccountUpdateMaxMiningFee(accountKey, value));
    };

    const feeRateMedianPercentage = getPercentage(feeRateMedian);
    const defaultMaxMiningFeePercentage = getPercentage(defaultMaxMiningFee);

    const trackStyle = {
        background: `\
            linear-gradient(90deg,\
                ${theme.GRADIENT_SLIDER_RED_END} 0%,\
                ${theme.GRADIENT_SLIDER_YELLOW_END} ${feeRateMedianPercentage / 1.1}%,\
                ${theme.GRADIENT_SLIDER_YELLOW_START} ${feeRateMedianPercentage}%,\
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
            inputWidth={112}
            trackStyle={trackStyle}
            labels={labels}
        />
    );
};
