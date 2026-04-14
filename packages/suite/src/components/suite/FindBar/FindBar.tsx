import React, { useEffect, useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';

import styled, { useTheme } from 'styled-components';

import { Translation, useTranslation } from '@suite/intl';
import {
    Box,
    ButtonGroup,
    Icon,
    IconButton,
    Input,
    Paragraph,
    Row,
    TOOLTIP_DELAY_LONG,
    Tooltip,
} from '@trezor/components';
import { borders, zIndices } from '@trezor/theme';

import { useFindBarShortcuts } from './useFindBarShortcuts';
import { useFindInPage } from './useFindInPage';

const Wrapper = styled.div`
    position: fixed;
    -webkit-app-region: no-drag;
    top: 10px;
    right: 16px;
    background: ${({ theme }) => theme.surfaceFillRaised};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    border-radius: ${borders.radii.sm};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    z-index: ${zIndices.windowControls};
`;

type FindBarFormProps = {
    setIsVisible: (isVisible: boolean) => void;
};

export const FindBarForm = ({ setIsVisible }: FindBarFormProps) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const theme = useTheme();

    const { translationString } = useTranslation();
    const { query, count, position, updateHighlights, clearHighlights, next, prev } =
        useFindInPage();

    useFindBarShortcuts({
        setVisible: setIsVisible,
        inputRef,
        clearHighlights,
        next,
        prev,
    });

    const focusInput = () => {
        setTimeout(() => inputRef.current?.select(), 100);
    };

    const handleCloseFindBar = () => {
        clearHighlights();
        setIsVisible(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateHighlights(e.target.value);
    };

    useEffect(() => {
        focusInput();
    }, []);

    return (
        <FocusLock>
            <Wrapper theme={theme} data-find-ignore>
                <Row gap={8} alignItems="center" margin={4}>
                    <Input
                        innerRef={inputRef}
                        size="small"
                        value={query}
                        placeholder={translationString('TR_FIND_PLACEHOLDER')}
                        data-testid="find-bar/input"
                        leftContent={
                            <Row
                                onClick={focusInput}
                                justifyContent="center"
                                alignItems="center"
                                width="100%"
                                height="100%"
                                cursor="pointer"
                            >
                                <Icon name="magnifyingGlass" size={12} />
                            </Row>
                        }
                        rightContent={
                            <Box minWidth={60} onClick={focusInput}>
                                {query && count > 0 && (
                                    <Paragraph
                                        typographyStyle="body-xs"
                                        intent="neutral"
                                        priority="secondary"
                                        minWidth={30}
                                        align="end"
                                    >
                                        {position}/{count}
                                    </Paragraph>
                                )}
                                {query && count === 0 && (
                                    <Paragraph
                                        typographyStyle="body-xs"
                                        intent="critical"
                                        align="end"
                                    >
                                        <Translation id="TR_FIND_NOT_FOUND" />
                                    </Paragraph>
                                )}
                            </Box>
                        }
                        onChange={handleInputChange}
                    />
                    <Row gap={8} justifyContent="flex-end">
                        <ButtonGroup intent="neutral" priority="secondary" size="small">
                            <Tooltip
                                content={<Translation id="TR_FIND_PREV" />}
                                delayShow={TOOLTIP_DELAY_LONG}
                            >
                                <IconButton icon="arrowUp" onClick={prev} />
                            </Tooltip>
                            <Tooltip
                                content={<Translation id="TR_FIND_NEXT" />}
                                delayShow={TOOLTIP_DELAY_LONG}
                            >
                                <IconButton icon="arrowDown" onClick={next} />
                            </Tooltip>
                        </ButtonGroup>
                        <Tooltip
                            content={<Translation id="TR_FIND_CLOSE" />}
                            delayShow={TOOLTIP_DELAY_LONG}
                        >
                            <IconButton
                                icon="x"
                                size="small"
                                intent="neutral"
                                priority="secondary"
                                onClick={handleCloseFindBar}
                            />
                        </Tooltip>
                    </Row>
                </Row>
            </Wrapper>
        </FocusLock>
    );
};

export const FindBar = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = () => {
            setIsVisible(true);
        };

        window.electronFind?.onShow(handler);

        return () => {
            window.electronFind?.offShow?.(handler);
        };
    }, [setIsVisible]);

    if (!isVisible) return null;

    return <FindBarForm setIsVisible={setIsVisible} />;
};
