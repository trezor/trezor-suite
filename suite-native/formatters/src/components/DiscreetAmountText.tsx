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
    const isConcealedByParent = useShouldRedactNumbers({ strict: false });

    const shouldWrapInDiscreet =
        !isConcealedByParent &&
        (discreetMode === 'enforced' || (discreetMode === 'auto' && isDiscreetMode));

    const text = <AmountText color={color} {...textProps} />;

    if (!shouldWrapInDiscreet) {
        return text;
    }

    return (
        <Discreet
            color={color}
            placeholderVariant={textProps.variant}
            isForcedDiscreetMode={discreetMode === 'enforced'}
        >
            {text}
        </Discreet>
    );
};
