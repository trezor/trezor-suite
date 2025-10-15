import React, { useEffect, useRef, useState } from 'react';
import FocusLock from 'react-focus-lock';

import styled, { useTheme } from 'styled-components';

import { Box, ButtonGroup, Icon, IconButton, Input, Paragraph, Row } from '@trezor/components';
import { borders, zIndices } from '@trezor/theme';

import { useFindBarShortcuts } from './useFindBarShortcuts';
import { useFindInPage } from './useFindInPage';
import { Translation } from '../../../components/suite/Translation';
import { useTranslation } from '../../../hooks/suite';

const Wrapper = styled.div`
    position: absolute;
    -webkit-app-region: no-drag;
    top: 10px;
    right: 16px;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border: 1px solid ${({ theme }) => theme.borderElevation1};
    border-radius: ${borders.radii.sm};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    z-index: ${zIndices.windowControls};
`;

export const FindBar = () => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const theme = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    const { translationString } = useTranslation();
    const { query, count, position, updateHighlights, clearHighlights, next, prev } = useFindInPage(
        { isActive: isVisible },
    );

    useFindBarShortcuts({
        visible: isVisible,
        setVisible: setIsVisible,
        inputRef,
        clearHighlights,
        next,
        prev,
    });

    useEffect(() => {
        window.electronFind?.onShow(() => {
            setIsVisible(true);
            setTimeout(() => inputRef.current?.select(), 100);
        });
    }, []);

    const handleCloseFindBar = () => {
        clearHighlights();
        setIsVisible(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateHighlights(e.target.value);
    };

    return isVisible ? (
        <FocusLock>
            <Wrapper theme={theme} data-find-ignore>
                <Row gap={8} alignItems="center" margin={4}>
                    <Input
                        innerRef={inputRef}
                        size="small"
                        value={query}
                        placeholder={translationString('TR_THP_FIND_IN_PAGE')}
                        data-testid="find-bar/input"
                        leftContent={<Icon name="magnifyingGlass" size="small" />}
                        rightContent={
                            <Box minWidth={95}>
                                {query && count > 0 && (
                                    <Row gap={8} justifyContent="flex-end">
                                        <ButtonGroup variant="tertiary" size="small">
                                            <IconButton
                                                icon="arrowUp"
                                                variant="tertiary"
                                                size="tiny"
                                                onClick={prev}
                                            />
                                            <IconButton
                                                icon="arrowDown"
                                                variant="tertiary"
                                                size="tiny"
                                                onClick={next}
                                            />
                                        </ButtonGroup>
                                        <Paragraph
                                            typographyStyle="label"
                                            variant="tertiary"
                                            minWidth={30}
                                            align="end"
                                        >
                                            {position}/{count}
                                        </Paragraph>
                                    </Row>
                                )}
                                {query && count === 0 && (
                                    <Paragraph
                                        typographyStyle="label"
                                        variant="destructive"
                                        align="end"
                                    >
                                        <Translation id="TR_NOT_FOUND" />
                                    </Paragraph>
                                )}
                            </Box>
                        }
                        onChange={handleInputChange}
                    />
                    <IconButton
                        icon="x"
                        variant="tertiary"
                        size="tiny"
                        onClick={handleCloseFindBar}
                    />
                </Row>
            </Wrapper>
        </FocusLock>
    ) : null;
};
