import { useDiscreetMode, useShouldRedactNumbers } from '@suite-common/discreet-mode';
import { Discreet } from '@suite-native/atoms';

import { type DiscreetMode } from '../types';
import { AmountText, type AmountTextProps } from './AmountText';

type DiscreetAmountTextProps = AmountTextProps & {
    discreetMode?: DiscreetMode;
};

export const DiscreetAmountText = ({
    discreetMode = 'auto',
    color = 'contentPrimary',
    ...textProps
}: DiscreetAmountTextProps) => {
    const { isDiscreetMode } = useDiscreetMode();
    const isRedactedByParent = useShouldRedactNumbers({ strict: false });

    const shouldWrapInDiscreet = !isRedactedByParent && discreetMode === 'auto' && isDiscreetMode;

    const text = <AmountText color={color} {...textProps} />;

    if (!shouldWrapInDiscreet) {
        return text;
    }

    return <Discreet>{text}</Discreet>;
};
