import {
    type ChangeEvent,
    type CompositionEvent,
    type KeyboardEvent,
    type MouseEvent,
    type SyntheticEvent,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { flushSync } from 'react-dom';
import { FreeFocusInside } from 'react-focus-lock';
import { useSelector } from 'react-redux';

import styled, { keyframes, useTheme } from 'styled-components';

import { injectDesktopApi } from '@suite/desktop-app-api';
import { Translation, useTranslation } from '@suite/intl';
import { selectRouterUrl } from '@suite/router';
import {
    Box,
    ButtonGroup,
    Icon,
    IconButton,
    Input,
    Row,
    TOOLTIP_DELAY_LONG,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { ArrowDownIcon, ArrowUpIcon, MagnifyingGlassIcon, XIcon } from '@trezor/icons';
import { typography, zIndices } from '@trezor/theme';

import { addedTextContainsFindQuery } from './findContentChange';
import {
    type FindQueryDirection,
    type FindQuerySelection,
    type FindQueryState,
    createFindQueryState,
    deleteFindQueryBackward,
    deleteFindQueryForward,
    getFindQueryRange,
    insertFindQueryText,
    moveFindQueryCaret,
    redoFindQuery,
    replaceFindQuery,
    selectAllFindQuery,
    selectFindQuery,
    selectionFromInputOffsets,
    undoFindQuery,
} from './findQueryEditor';
import { useFindBarShortcuts } from './useFindBarShortcuts';
import { useFindInPage } from './useFindInPage';

const Wrapper = styled.div`
    position: fixed;
    -webkit-app-region: no-drag;
    top: 10px;
    right: 16px;
    background: ${({ theme }) => theme.surfaceFillRaised};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    border-radius: 12px;
    box-shadow: ${({ theme }) => theme.surfaceShadowFixed};
    z-index: ${zIndices.windowControls};
`;

// The bar is above modals, so a modal focus lock would take a click back.
const FindBarFocus = styled(FreeFocusInside)`
    display: contents;
`;

const caretBlink = keyframes`
    50% {
        opacity: 0;
    }
`;

// Chromium indexes input values and text nodes, and find has no exclude list.
// CSS content is not indexed, so the query is shown that way while the field is empty.
const QueryGhost = styled.div<{ $isPlaceholder: boolean }>`
    ${typography['body-sm']}
    position: absolute;
    display: flex;
    align-items: center;
    overflow: hidden;
    box-sizing: border-box;
    white-space: pre;
    pointer-events: none;
    font-feature-settings:
        'tnum' 1,
        'zero' 1,
        'ss03' 1;
    color: ${({ theme, $isPlaceholder }) =>
        $isPlaceholder ? theme.contentDisabled : theme.contentPrimary};

    &::before {
        content: attr(data-query);
    }
`;

const SelectionHighlight = styled.div`
    position: absolute;
    top: 8px;
    bottom: 8px;
    background: ${({ theme }) => theme.contentPrimary};
    opacity: 0.25;
    pointer-events: none;
`;

const QueryCaret = styled.div`
    position: absolute;
    top: 8px;
    bottom: 8px;
    width: 1px;
    background: ${({ theme }) => theme.contentPrimary};
    animation: ${caretBlink} 1s step-end infinite;
    pointer-events: none;
`;

const MatchCount = styled.span<{ $isMissing: boolean }>`
    min-width: 30px;
    font-size: 12px;
    line-height: 16px;
    text-align: end;
    white-space: nowrap;
    color: ${({ theme, $isMissing }) =>
        $isMissing ? theme.contentCritical : theme.contentSecondary};

    &::before {
        content: attr(data-label);
    }
`;

const TextProbe = styled.span`
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    white-space: pre;
    pointer-events: none;
`;

type QueryOverlay = {
    left: number;
    top: number;
    width: number;
    height: number;
    paddingLeft: number;
    paddingRight: number;
    minWidth: number;
    caretX: number;
    selectionX: number;
    selectionWidth: number;
};

const initialOverlay: QueryOverlay = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: 160,
    caretX: 0,
    selectionX: 0,
    selectionWidth: 0,
};

const roundPixels = (value: number): number => Math.round(value);

const isSameOverlay = (current: QueryOverlay, next: QueryOverlay): boolean =>
    current.left === next.left &&
    current.top === next.top &&
    current.width === next.width &&
    current.height === next.height &&
    current.paddingLeft === next.paddingLeft &&
    current.paddingRight === next.paddingRight &&
    current.minWidth === next.minWidth &&
    current.caretX === next.caretX &&
    current.selectionX === next.selectionX &&
    current.selectionWidth === next.selectionWidth;

const copyTextStyle = (input: HTMLInputElement, probe: HTMLElement) => {
    const style = getComputedStyle(input);
    probe.style.font = style.font;
    probe.style.letterSpacing = style.letterSpacing;
    probe.style.fontFeatureSettings = style.fontFeatureSettings;
    probe.style.fontKerning = style.fontKerning;
    probe.style.textTransform = style.textTransform;
    probe.style.whiteSpace = 'pre';
};

const measureTextWidth = (probe: HTMLElement, text: string): number => {
    probe.textContent = text;

    return probe.scrollWidth;
};

const getCaretIndex = (
    probe: HTMLElement,
    input: HTMLInputElement,
    clientX: number,
    query: string,
): number => {
    copyTextStyle(input, probe);
    const paddingLeft = Number.parseFloat(getComputedStyle(input).paddingLeft) || 0;
    const target = clientX - input.getBoundingClientRect().left - paddingLeft;
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index <= query.length; index += 1) {
        const distance = Math.abs(measureTextWidth(probe, query.slice(0, index)) - target);
        if (distance < bestDistance) {
            bestIndex = index;
            bestDistance = distance;
        }
    }

    probe.textContent = '';

    return bestIndex;
};

const getMatchLabel = (
    query: string,
    count: number,
    position: number,
    notFoundLabel: string,
): string => {
    if (query.length === 0) return '';
    if (count === 0) return notFoundLabel;

    return `${position}/${count}`;
};

const getDeletionBoundary = (
    event: KeyboardEvent<HTMLInputElement>,
): 'character' | 'word' | 'line' => {
    if (event.metaKey) return 'line';
    if (event.altKey || event.ctrlKey) return 'word';

    return 'character';
};

const getCaretMove = (
    event: KeyboardEvent<HTMLInputElement>,
): { direction: FindQueryDirection; byWord: boolean } | null => {
    if (event.key === 'ArrowLeft') {
        if (event.metaKey) return { direction: 'home', byWord: false };

        return { direction: 'left', byWord: event.altKey || event.ctrlKey };
    }

    if (event.key === 'ArrowRight') {
        if (event.metaKey) return { direction: 'end', byWord: false };

        return { direction: 'right', byWord: event.altKey || event.ctrlKey };
    }

    if (event.key === 'Home') return { direction: 'home', byWord: false };
    if (event.key === 'End') return { direction: 'end', byWord: false };

    return null;
};

const applyInputSelection = (input: HTMLInputElement, selection: FindQuerySelection) => {
    const start = Math.min(selection.anchor, selection.focus);
    const end = Math.max(selection.anchor, selection.focus);
    input.setSelectionRange(
        start,
        end,
        selection.focus < selection.anchor ? 'backward' : 'forward',
    );
};

type FindBarFormProps = {
    setIsVisible: (isVisible: boolean) => void;
};

export const FindBarForm = ({ setIsVisible }: FindBarFormProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const barRef = useRef<HTMLDivElement | null>(null);
    const fieldRef = useRef<HTMLElement | null>(null);
    const probeRef = useRef<HTMLSpanElement | null>(null);
    const theme = useTheme();
    const { translationString } = useTranslation();
    const url = useSelector(selectRouterUrl);
    const placeholder = translationString('TR_FIND_PLACEHOLDER');
    const notFoundLabel = translationString('TR_FIND_NOT_FOUND');

    const [queryState, setQueryState] = useState(createFindQueryState);
    const [isQueryHiddenFromFind, setIsQueryHiddenFromFind] = useState(false);
    const [shouldRestoreFocus, setShouldRestoreFocus] = useState(false);
    const [isFieldFocused, setIsFieldFocused] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [overlay, setOverlay] = useState(initialOverlay);
    const [pageContentRevision, setPageContentRevision] = useState(0);

    const queryStateRef = useRef(queryState);
    const isQueryHiddenFromFindRef = useRef(false);
    const isComposingRef = useRef(false);
    const keepFocusRef = useRef(true);
    const outsideFocusRef = useRef<HTMLElement | null>(null);
    const refocusFrameRef = useRef<number | null>(null);
    const urlRef = useRef(url);
    const searchedUrlRef = useRef(url);
    const searchedContentRevisionRef = useRef(0);

    const scheduleQueryRefocus = () => {
        if (refocusFrameRef.current !== null) return;

        // Chromium drops focus after reporting matches. Take it back once that has finished.
        refocusFrameRef.current = requestAnimationFrame(() => {
            refocusFrameRef.current = null;
            const input = inputRef.current;
            if (!keepFocusRef.current || input === null || document.activeElement === input) return;

            input.focus();
        });
    };

    const restoreFindField = () => {
        if (isComposingRef.current) return;

        if (keepFocusRef.current) {
            scheduleQueryRefocus();

            return;
        }

        setIsQueryHiddenFromFind(false);
    };

    const { count, position, search, stop, next, prev } = useFindInPage(restoreFindField);

    const commit = (nextState: FindQueryState) => {
        const queryChanged = nextState.query !== queryStateRef.current.query;
        queryStateRef.current = nextState;

        if (!queryChanged) {
            setQueryState(nextState);
            const input = inputRef.current;
            if (input && !isQueryHiddenFromFindRef.current)
                applyInputSelection(input, nextState.selection);

            return;
        }

        isQueryHiddenFromFindRef.current = true;
        if (keepFocusRef.current) outsideFocusRef.current = null;
        flushSync(() => {
            setQueryState(nextState);
            setIsQueryHiddenFromFind(true);
            setShouldRestoreFocus(keepFocusRef.current);
        });
        search(nextState.query);
    };

    // Chromium continues a search from the DOM selection. A caret in this field
    // makes next/previous start there instead of at the active match.
    const findAdjacentMatch = (move: () => void) => {
        const input = inputRef.current;
        if (input !== null && document.activeElement === input) input.blur();
        document.getSelection()?.removeAllRanges();

        if (queryStateRef.current.query.length === 0) {
            move();

            return;
        }

        isQueryHiddenFromFindRef.current = true;
        flushSync(() => {
            setIsQueryHiddenFromFind(true);
            setShouldRestoreFocus(keepFocusRef.current);
        });
        move();
    };

    const findNextMatch = () => {
        findAdjacentMatch(next);
    };

    const findPreviousMatch = () => {
        findAdjacentMatch(prev);
    };

    const selectQuery = () => {
        keepFocusRef.current = true;
        inputRef.current?.focus();
        commit(selectAllFindQuery(queryStateRef.current));
    };

    useFindBarShortcuts({
        setVisible: setIsVisible,
        inputRef,
        selectQuery,
        stop,
        next: findNextMatch,
        prev: findPreviousMatch,
    });

    const focusQuery = () => {
        keepFocusRef.current = true;
        inputRef.current?.focus();
    };

    const handleCloseFindBar = () => {
        stop();
        setIsVisible(false);
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (isComposingRef.current) return;

        const input = event.target;
        const { current } = queryStateRef;
        const nextState = isQueryHiddenFromFindRef.current
            ? insertFindQueryText(current, input.value)
            : replaceFindQuery(
                  current,
                  input.value,
                  selectionFromInputOffsets(
                      input.selectionStart ?? input.value.length,
                      input.selectionEnd ?? input.value.length,
                      input.selectionDirection,
                  ),
              );
        commit(nextState);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.nativeEvent.isComposing || isComposingRef.current) return;

        const key = event.key.toLowerCase();
        const hasCommand = event.metaKey || event.ctrlKey;
        const { current } = queryStateRef;

        if (hasCommand && key === 'a') {
            event.preventDefault();
            commit(selectAllFindQuery(current));

            return;
        }

        if (hasCommand && key === 'z') {
            event.preventDefault();
            commit(event.shiftKey ? redoFindQuery(current) : undoFindQuery(current));

            return;
        }

        if (!isQueryHiddenFromFindRef.current) return;

        const caretMove = getCaretMove(event);
        if (caretMove) {
            event.preventDefault();
            commit(
                moveFindQueryCaret(current, caretMove.direction, {
                    expand: event.shiftKey,
                    byWord: caretMove.byWord,
                }),
            );

            return;
        }

        if (event.key === 'Backspace') {
            event.preventDefault();
            commit(deleteFindQueryBackward(current, getDeletionBoundary(event)));

            return;
        }

        if (event.key === 'Delete') {
            event.preventDefault();
            commit(deleteFindQueryForward(current, getDeletionBoundary(event)));
        }
    };

    const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
        if (isQueryHiddenFromFindRef.current || isComposingRef.current) return;

        const input = event.currentTarget;
        const nextState = selectFindQuery(
            queryStateRef.current,
            selectionFromInputOffsets(
                input.selectionStart ?? 0,
                input.selectionEnd ?? 0,
                input.selectionDirection,
            ),
        );
        if (nextState === queryStateRef.current) return;

        queryStateRef.current = nextState;
        setQueryState(nextState);
    };

    const handleMouseDown = (event: MouseEvent<HTMLInputElement>) => {
        keepFocusRef.current = true;
        const probe = probeRef.current;
        if (!probe || !isQueryHiddenFromFindRef.current) return;

        const index = getCaretIndex(
            probe,
            event.currentTarget,
            event.clientX,
            queryStateRef.current.query,
        );
        const anchor = event.shiftKey ? queryStateRef.current.selection.anchor : index;
        commit(selectFindQuery(queryStateRef.current, { anchor, focus: index }));
    };

    const handleMouseMove = (event: MouseEvent<HTMLInputElement>) => {
        const probe = probeRef.current;
        if (!probe || !isQueryHiddenFromFindRef.current || event.buttons !== 1) return;

        const index = getCaretIndex(
            probe,
            event.currentTarget,
            event.clientX,
            queryStateRef.current.query,
        );
        commit(
            selectFindQuery(queryStateRef.current, {
                anchor: queryStateRef.current.selection.anchor,
                focus: index,
            }),
        );
    };

    const handleCompositionStart = () => {
        isComposingRef.current = true;
        setIsComposing(true);
    };

    const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
        isComposingRef.current = false;
        setIsComposing(false);
        const input = event.currentTarget;
        commit(
            replaceFindQuery(
                queryStateRef.current,
                input.value,
                selectionFromInputOffsets(
                    input.selectionStart ?? input.value.length,
                    input.selectionEnd ?? input.value.length,
                    input.selectionDirection,
                ),
            ),
        );
    };

    useLayoutEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(
        () => () => {
            if (refocusFrameRef.current === null) return;

            cancelAnimationFrame(refocusFrameRef.current);
        },
        [],
    );

    useLayoutEffect(() => {
        queryStateRef.current = queryState;
        isQueryHiddenFromFindRef.current = isQueryHiddenFromFind;
    }, [queryState, isQueryHiddenFromFind]);

    // Find highlights belong to the DOM Chromium searched. A new page replaces that DOM.
    useLayoutEffect(() => {
        if (urlRef.current === url) return;

        urlRef.current = url;
        if (queryStateRef.current.query.length === 0) return;

        isQueryHiddenFromFindRef.current = true;
        setIsQueryHiddenFromFind(true);
        setShouldRestoreFocus(keepFocusRef.current);
    }, [url]);

    useEffect(() => {
        if (searchedUrlRef.current === url) return;

        const { query } = queryStateRef.current;
        if (query.length > 0 && !isQueryHiddenFromFind) return;

        searchedUrlRef.current = url;
        if (query.length === 0) return;

        search(query);
    }, [url, isQueryHiddenFromFind, search]);

    // A modal can mount the address after the search. Chromium does not highlight that new DOM.
    useEffect(() => {
        const bar = barRef.current;
        const observer = new MutationObserver(mutations => {
            if (
                !addedTextContainsFindQuery(
                    mutations,
                    queryStateRef.current.query,
                    node => bar?.contains(node) ?? false,
                )
            ) {
                return;
            }

            setPageContentRevision(revision => revision + 1);
        });

        observer.observe(document.body, {
            childList: true,
            characterData: true,
            subtree: true,
        });

        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        if (pageContentRevision === 0 || queryStateRef.current.query.length === 0) return;

        isQueryHiddenFromFindRef.current = true;
        setIsQueryHiddenFromFind(true);
        setShouldRestoreFocus(keepFocusRef.current);
    }, [pageContentRevision]);

    useEffect(() => {
        if (
            pageContentRevision === 0 ||
            searchedContentRevisionRef.current === pageContentRevision
        ) {
            return;
        }

        const { query } = queryStateRef.current;
        if (query.length > 0 && !isQueryHiddenFromFind) return;

        searchedContentRevisionRef.current = pageContentRevision;
        if (query.length === 0) return;

        search(query);
    }, [pageContentRevision, isQueryHiddenFromFind, search]);

    useLayoutEffect(() => {
        if (isQueryHiddenFromFind || !shouldRestoreFocus) return;

        const input = inputRef.current;
        if (keepFocusRef.current && input) {
            input.focus();
            applyInputSelection(input, queryStateRef.current.selection);
        } else {
            outsideFocusRef.current?.focus();
        }
        setShouldRestoreFocus(false);
    }, [isQueryHiddenFromFind, shouldRestoreFocus]);

    useLayoutEffect(() => {
        const input = inputRef.current;
        const field = fieldRef.current;
        const probe = probeRef.current;
        if (!input || !field || !probe) return;

        const inputStyle = getComputedStyle(input);
        copyTextStyle(input, probe);
        const paddingLeft = roundPixels(Number.parseFloat(inputStyle.paddingLeft) || 0);
        const paddingRight = roundPixels(Number.parseFloat(inputStyle.paddingRight) || 0);
        const displayText = queryState.query || placeholder;
        const textWidth = measureTextWidth(probe, displayText);
        const range = getFindQueryRange(queryState.selection);
        const selectionStart = measureTextWidth(probe, queryState.query.slice(0, range.start));
        const selectionEnd = measureTextWidth(probe, queryState.query.slice(0, range.end));
        probe.textContent = '';

        const inputRect = input.getBoundingClientRect();
        const fieldRect = field.getBoundingClientRect();
        const contentWidth = textWidth + paddingLeft + paddingRight;
        const minWidth =
            inputStyle.boxSizing === 'border-box' ? contentWidth : roundPixels(textWidth);
        const nextOverlay: QueryOverlay = {
            left: roundPixels(inputRect.left - fieldRect.left),
            top: roundPixels(inputRect.top - fieldRect.top),
            width: roundPixels(inputRect.width),
            height: roundPixels(inputRect.height),
            paddingLeft,
            paddingRight,
            minWidth: Math.max(minWidth, 160),
            caretX: roundPixels(paddingLeft + selectionEnd),
            selectionX: roundPixels(paddingLeft + selectionStart),
            selectionWidth: roundPixels(Math.max(selectionEnd - selectionStart, 0)),
        };

        setOverlay(current => (isSameOverlay(current, nextOverlay) ? current : nextOverlay));
    }, [queryState, placeholder, isQueryHiddenFromFind, isComposing]);

    useEffect(() => {
        const onPointerDown = (event: PointerEvent) => {
            const bar = barRef.current;
            const { target } = event;
            const isInside = bar !== null && target instanceof Node && bar.contains(target);
            keepFocusRef.current = isInside;
            if (!isInside) {
                outsideFocusRef.current = null;
                setIsFieldFocused(false);
            }
        };
        const onFocusIn = (event: FocusEvent) => {
            if (keepFocusRef.current || outsideFocusRef.current) return;

            const { target } = event;
            const bar = barRef.current;
            if (!(target instanceof HTMLElement) || bar?.contains(target)) return;

            outsideFocusRef.current = target;
        };
        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            keepFocusRef.current = false;
            outsideFocusRef.current = null;
        };

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('focusin', onFocusIn, true);
        document.addEventListener('keydown', onKeyDown, true);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('focusin', onFocusIn, true);
            document.removeEventListener('keydown', onKeyDown, true);
        };
    }, []);

    const { query } = queryState;
    const inputValue = isQueryHiddenFromFind && !isComposing ? '' : query;
    const showGhost = (isQueryHiddenFromFind || query.length === 0) && !isComposing;
    const showPlaceholder = query.length === 0;
    const matchLabel = getMatchLabel(query, count, position, notFoundLabel);
    const isMissing = query.length > 0 && count === 0;
    const range = getFindQueryRange(queryState.selection);
    const showCaret =
        isQueryHiddenFromFind && isFieldFocused && range.start === range.end && !isComposing;
    const showSelection = isQueryHiddenFromFind && overlay.selectionWidth > 0 && !isComposing;

    return (
        <Wrapper ref={barRef} theme={theme}>
            <Row gap={8} alignItems="center" margin={4}>
                <Box ref={fieldRef} position={{ type: 'relative' }} flex="1">
                    <Input
                        innerRef={inputRef}
                        size="small"
                        value={inputValue}
                        aria-label={placeholder}
                        data-testid="find-bar/input"
                        style={{
                            minWidth: overlay.minWidth,
                            caretColor: isQueryHiddenFromFind ? 'transparent' : undefined,
                            color: isQueryHiddenFromFind ? 'transparent' : undefined,
                        }}
                        leftContent={
                            <Row
                                onClick={focusQuery}
                                justifyContent="center"
                                alignItems="center"
                                width="100%"
                                height="100%"
                                cursor="pointer"
                            >
                                <Icon as={MagnifyingGlassIcon} size={12} />
                            </Row>
                        }
                        rightContent={
                            <Box minWidth={60} onClick={focusQuery}>
                                <MatchCount $isMissing={isMissing} data-label={matchLabel} />
                            </Box>
                        }
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onSelect={handleSelect}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onFocus={() => {
                            keepFocusRef.current = true;
                            setIsFieldFocused(true);
                        }}
                        onBlur={event => {
                            const nextTarget = event.relatedTarget;
                            const findClearedFocus =
                                nextTarget === null ||
                                nextTarget === document.body ||
                                nextTarget === document.documentElement;

                            if (keepFocusRef.current && findClearedFocus) {
                                scheduleQueryRefocus();

                                return;
                            }

                            setIsFieldFocused(false);
                        }}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                    />
                    <QueryGhost
                        $isPlaceholder={showPlaceholder}
                        data-query={showPlaceholder ? placeholder : query}
                        aria-hidden
                        style={{
                            left: overlay.left,
                            top: overlay.top,
                            width: overlay.width,
                            height: overlay.height,
                            paddingLeft: overlay.paddingLeft,
                            paddingRight: overlay.paddingRight,
                            visibility: showGhost ? 'visible' : 'hidden',
                        }}
                    >
                        {showSelection && (
                            <SelectionHighlight
                                style={{
                                    left: overlay.selectionX,
                                    width: overlay.selectionWidth,
                                }}
                            />
                        )}
                        {showCaret && <QueryCaret style={{ left: overlay.caretX }} />}
                    </QueryGhost>
                    <TextProbe ref={probeRef} aria-hidden />
                </Box>
                <Row gap={8} justifyContent="flex-end">
                    <ButtonGroup intent="neutral" priority="secondary" size="small">
                        <IconButton
                            icon={ArrowUpIcon}
                            onClick={findPreviousMatch}
                            tooltip={{
                                content: <Translation id="TR_FIND_PREV" />,
                                delayShow: TOOLTIP_DELAY_LONG,
                            }}
                        />
                        <IconButton
                            icon={ArrowDownIcon}
                            onClick={findNextMatch}
                            tooltip={{
                                content: <Translation id="TR_FIND_NEXT" />,
                                delayShow: TOOLTIP_DELAY_LONG,
                            }}
                        />
                    </ButtonGroup>
                    <IconButton
                        icon={XIcon}
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={handleCloseFindBar}
                        tooltip={{
                            content: <Translation id="TR_FIND_CLOSE" />,
                            delayShow: TOOLTIP_DELAY_LONG,
                        }}
                    />
                </Row>
            </Row>
        </Wrapper>
    );
};

export const FindBar = () => {
    const { desktopApi } = useServices(injectDesktopApi);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!desktopApi.available) return;

        desktopApi.on('find:show', () => {
            setIsVisible(true);
        });

        return () => {
            desktopApi.removeAllListeners('find:show');
        };
    }, [desktopApi]);

    if (!isVisible) return null;

    return (
        <FindBarFocus>
            <FindBarForm setIsVisible={setIsVisible} />
        </FindBarFocus>
    );
};
