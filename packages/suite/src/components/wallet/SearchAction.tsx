import { useCallback, useRef, Dispatch, SetStateAction, KeyboardEvent } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Input, Icon, KEYBOARD_CODE, motionEasing } from '@trezor/components';
import { borders, spacingsPx } from '@trezor/theme';

import { useTranslation } from 'src/hooks/suite/useTranslation';
import { TooltipSymbol, Translation } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';

const Container = styled.div`
    display: flex;
    align-items: center;
`;

const TRANSITION_DURATION = 0.26;
const easingValues = motionEasing.transition.join(', '); // TODO: add to motionEasing

const StyledTooltipSymbol = styled(TooltipSymbol)<{ $isExpanded: boolean }>`
    transition: all ${TRANSITION_DURATION * 1.5}s cubic-bezier(${easingValues});

    ${({ $isExpanded }) =>
        !$isExpanded &&
        css`
            opacity: 0;
            transform: translateX(20px);
        `}
`;

const INPUT_WIDTH = '38px';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledInput = styled(Input)<{ $isExpanded: boolean }>`
    width: ${({ $isExpanded }) => ($isExpanded ? '210px' : INPUT_WIDTH)};
    margin-right: ${spacingsPx.xs};
    transition: width ${TRANSITION_DURATION}s cubic-bezier(${easingValues});
    overflow: hidden;
    border-radius: ${borders.radii.full};

    cursor: ${({ $isExpanded }) => (!$isExpanded ? 'pointer' : undefined)};

    input {
        height: ${INPUT_WIDTH};
        border: none;
        cursor: ${({ $isExpanded }) => (!$isExpanded ? 'pointer' : undefined)};
    }
`;

export interface SearchProps {
    tooltipText: TranslationKey;
    placeholder: TranslationKey;
    isExpanded: boolean;
    searchQuery: string;
    setExpanded: Dispatch<SetStateAction<boolean>>;
    setSearch: Dispatch<SetStateAction<string>>;
    onSearch: (query: string) => void;
    'data-testid'?: string;
}

export const SearchAction = ({
    tooltipText,
    placeholder,
    isExpanded,
    searchQuery,
    setExpanded,
    setSearch,
    onSearch,
    'data-testid': dataTest,
}: SearchProps) => {
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement | null>(null);
    const { translationString } = useTranslation();

    const openAndSelect = useCallback(() => {
        setExpanded(true);
        inputRef.current?.select();
    }, [setExpanded]);

    const onBlur = useCallback(() => {
        if (searchQuery === '') {
            setExpanded(false);
        }
    }, [setExpanded, searchQuery]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Handle ESC (un-focus)
            if (event.code === KEYBOARD_CODE.ESCAPE && inputRef.current) {
                setSearch('');
                inputRef.current.blur();
            }
        },
        [setSearch],
    );

    return (
        <Container>
            <StyledTooltipSymbol
                content={<Translation id={tooltipText} />}
                $isExpanded={isExpanded || searchQuery !== ''}
            />

            <StyledInput
                $isExpanded={isExpanded || searchQuery !== ''}
                data-testid={dataTest}
                size="small"
                innerRef={inputRef}
                innerAddon={
                    <Icon
                        name="search"
                        size={16}
                        color={theme.iconDefault}
                        onClick={!isExpanded ? openAndSelect : undefined}
                    />
                }
                placeholder={isExpanded ? translationString(placeholder) : undefined}
                onChange={e => onSearch(e.target.value)}
                onClick={!isExpanded ? openAndSelect : undefined}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                value={searchQuery}
                innerAddonAlign="left"
                maxLength={512}
                showClearButton="always"
                onClear={() => setSearch('')}
            />
        </Container>
    );
};
