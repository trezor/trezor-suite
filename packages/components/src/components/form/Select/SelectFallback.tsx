import styled from 'styled-components';

import { Box } from '../../Box/Box';
import { InputWrapper } from '../InputWrapper';
import { type InputSize } from '../types';
import { mapSizeToHeight } from '../utils';

/**
 * Focusable, so a click or Tab elsewhere blurs it and drops the press.
 * The input wrapper around it shows the focus, so it needs no outline of its own.
 */
const PressTarget = styled.div`
    cursor: pointer;
    outline: none;
`;

type SelectFallbackProps = {
    size?: InputSize;
    isClean?: boolean;
    hasError?: boolean;
    isDisabled?: boolean;
    /**
     * Called on mousedown, where react-select opens too, so the loaded control can open as if clicked.
     * A touch tap ends with one, a touch that scrolls does not.
     */
    onPress?: () => void;
    /** Called when focus leaves the control, which drops the press. */
    onPressCancel?: () => void;
    /** Set on the pressable control only. */
    'data-testid'?: string;
};

/** An empty control of the same size, shown while the react-select part of `Select` loads. */
export const SelectFallback = ({
    size = 'large',
    isClean,
    hasError,
    isDisabled,
    onPress,
    onPressCancel,
    'data-testid': dataTest,
}: SelectFallbackProps) => {
    const placeholder = <Box minHeight={isClean ? undefined : mapSizeToHeight(size)} />;

    return (
        <InputWrapper hasError={hasError} isDisabled={isDisabled} size={size} isClean={isClean}>
            {onPress && !isDisabled ? (
                <PressTarget
                    tabIndex={-1}
                    onMouseDown={onPress}
                    onBlur={onPressCancel}
                    data-testid={dataTest}
                >
                    {placeholder}
                </PressTarget>
            ) : (
                placeholder
            )}
        </InputWrapper>
    );
};
