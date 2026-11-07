import { Box } from '../../Box/Box';
import { InputWrapper } from '../InputWrapper';
import { type InputSize } from '../types';
import { mapSizeToHeight } from '../utils';

type SelectFallbackProps = {
    size?: InputSize;
    isClean?: boolean;
    hasError?: boolean;
    isDisabled?: boolean;
};

/** An empty control of the same size, shown while the react-select part of `Select` loads. */
export const SelectFallback = ({
    size = 'large',
    isClean,
    hasError,
    isDisabled,
}: SelectFallbackProps) => (
    <InputWrapper hasError={hasError} isDisabled={isDisabled} size={size} isClean={isClean}>
        <Box minHeight={isClean ? undefined : mapSizeToHeight(size)} />
    </InputWrapper>
);
