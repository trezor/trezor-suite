import {
    Dispatch,
    KeyboardEvent,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import { Elevation, borders, spacingsPx, typography } from '@trezor/theme';

import { motionEasing } from '../../../config/motion';
import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { useElevation } from '../../ElevationContext/ElevationContext';
import { Row } from '../../Flex/Flex';
import { IconName } from '../../Icon/Icon';
import { IconButton } from '../../buttons/IconButton/IconButton';
import { mapElevationToButtonOnBackground } from '../../buttons/buttonStyleUtils';

const Wrapper = styled.div<{ $elevation: Elevation }>`
    position: relative;
    border-radius: ${borders.radii.full};
    background: ${({ theme, $elevation }) =>
        mapElevationToButtonOnBackground({ elevation: $elevation, theme, state: 'normal' })};
`;

const HiddenPlaceholder = styled.div`
    ${typography.hint};
    position: absolute;
    white-space: nowrap;
    pointer-events: none;
    visibility: hidden;
`;

const Input = styled.input<{ $width: number }>`
    ${typography.hint};
    height: 100%;
    border: none;
    background: transparent;
    width: ${({ $width }) => $width}px;
    color: ${({ theme }) => theme.textDefault};
    padding: 0 ${spacingsPx.lg} 0 ${spacingsPx.xs};
    box-sizing: content-box;

    &::placeholder {
        color: ${({ theme }) => theme.textSubdued};
    }
`;

const InputWrapper = styled(motion.div)`
    overflow: hidden;
`;

export type InputButtonProps = {
    iconName?: IconName;
    isExpanded: boolean;
    value: string;
    setExpanded: Dispatch<SetStateAction<boolean>>;
    setValue: Dispatch<SetStateAction<string>>;
    onChange: (value: string) => void;
    'data-testid'?: string;
    placeholder?: string;
};

export const InputButton = ({
    placeholder,
    iconName = 'magnifyingGlass',
    isExpanded,
    value,
    setExpanded,
    setValue,
    onChange,
    'data-testid': dataTest,
}: InputButtonProps) => {
    const { elevation } = useElevation();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const placeholderRef = useRef<HTMLDivElement | null>(null);
    const [placeholderWidth, setPlaceholderWidth] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const isDirty = value !== '';

    useEffect(() => {
        document.fonts.ready.then(() => {
            requestAnimationFrame(() => {
                if (placeholderRef.current) {
                    setPlaceholderWidth(placeholderRef.current.scrollWidth);
                }
            });
        });
    }, [placeholder]);

    useEffect(() => {
        if (contentRef.current) {
            setContentWidth(contentRef.current.scrollWidth);
        }
    }, [placeholderWidth]);

    const toggle = useCallback(() => {
        if (isDirty) {
            return;
        }

        setExpanded(prev => {
            if (!prev) {
                inputRef.current?.select();
            } else {
                inputRef.current?.blur();
            }

            return !prev;
        });
    }, [setExpanded, isDirty]);

    const clear = useCallback(() => {
        setValue('');
        inputRef.current?.select();
    }, [setValue]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Handle ESC (un-focus)
            if (event.code === KEYBOARD_CODE.ESCAPE && inputRef.current) {
                setValue('');
                inputRef.current.blur();
            }
        },
        [setValue],
    );

    return (
        <Wrapper $elevation={elevation}>
            <HiddenPlaceholder aria-hidden="true" ref={placeholderRef}>
                {placeholder}
            </HiddenPlaceholder>
            <Row alignItems="stretch">
                <IconButton
                    icon={isDirty ? 'xCircleFilled' : iconName}
                    size="small"
                    onClick={isDirty ? clear : toggle}
                    variant="tertiary"
                />
                <InputWrapper
                    animate={isExpanded || isDirty ? 'expanded' : 'collapsed'}
                    transition={{ duration: 0.3, ease: motionEasing.transition }}
                    variants={{
                        collapsed: { width: 0 },
                        expanded: { width: contentWidth },
                    }}
                    initial="collapsed"
                    ref={contentRef}
                >
                    <Input
                        $width={Math.max(placeholderWidth, 120)}
                        type="text"
                        placeholder={placeholder}
                        data-testid={dataTest}
                        ref={inputRef}
                        onKeyDown={onKeyDown}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        autoComplete="off"
                        autoCorrect="off"
                        name="search"
                        autoCapitalize="off"
                        data-lpignore="true"
                        spellCheck={false}
                    />
                </InputWrapper>
            </Row>
        </Wrapper>
    );
};
