import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { Button, Icon, Paragraph, Row, Tooltip, useElevation } from '@trezor/components';
import { isMacOs } from '@trezor/env-utils';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import {
    Body,
    Columns,
    MainContent,
    PageWrapper,
    Wrapper,
} from 'src/components/suite/layouts/SuiteLayout/SuiteLayout';
import { useDispatch } from 'src/hooks/suite';
import { useBioAuthDesktopApi } from 'src/hooks/suite/useBioAuthDesktopApi';

const Container = styled.div<{ $elevation: Elevation }>`
    display: flex;
    border: 1px solid ${mapElevationToBorder};
    gap: ${spacingsPx.xxs};
    align-items: center;
    width: 334px;
    height: 212px;
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.lg};
    flex-direction: column;
    justify-content: space-between;
    user-select: none;
    padding: ${spacingsPx.sm} ${spacingsPx.xxs};
`;

const BioAuthOverlay = ({
    isBioAuthAvailable,
    onPrimaryButtonClick,
}: {
    isBioAuthAvailable: boolean;
    onPrimaryButtonClick: () => void;
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { elevation } = useElevation();

    return (
        <Wrapper ref={wrapperRef} data-testid="@suite-layout">
            <PageWrapper>
                <Body data-testid="@suite-layout/body">
                    <Columns>
                        <MainContent>
                            <Row
                                height="100%"
                                width="100%"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Container $elevation={elevation}>
                                    <Icon name="lockFilled" />
                                    <Paragraph align="center" typographyStyle="headline-sm">
                                        <Translation id="TR_BIO_AUTH_LOCKED_HEADING" />
                                    </Paragraph>
                                    <Paragraph align="center" typographyStyle="body-md">
                                        {isMacOs() ? (
                                            <Translation id="TR_BIO_AUTH_LOCKED_TEXT_MAC" />
                                        ) : (
                                            <Translation id="TR_BIO_AUTH_LOCKED_TEXT_WIN" />
                                        )}
                                    </Paragraph>
                                    <Tooltip
                                        width="100%"
                                        isActive={!isBioAuthAvailable}
                                        content={
                                            <Translation id="TR_BIO_AUTH_NOT_AVAILABLE_TOOLTIP_CONTENT" />
                                        }
                                    >
                                        <Button
                                            isDisabled={!isBioAuthAvailable}
                                            width="100%"
                                            intent="brand"
                                            onClick={() => onPrimaryButtonClick()}
                                        >
                                            <Translation id="TR_BIO_AUTH_UNLOCK" />
                                        </Button>
                                    </Tooltip>
                                </Container>
                            </Row>
                        </MainContent>
                    </Columns>
                </Body>
            </PageWrapper>
        </Wrapper>
    );
};

export const BioAuthGuard = ({ children }: { children: React.ReactNode }) => {
    const [isWindowFocused, setIsWindowFocused] = useState(true);

    const {
        isBioAuthAvailable,
        isBioAuthEnabled,
        isBioAuthValidationRequired,
        requestBioAuthValidation,
        isCallInProgress,
        cancelled,
    } = useBioAuthDesktopApi();

    const dispatch = useDispatch();

    useEffect(() => {
        if (!isBioAuthEnabled) return;

        const handleBlur = () => {
            setIsWindowFocused(false);
        };

        const handleFocus = () => {
            setIsWindowFocused(true);
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [dispatch, isBioAuthEnabled]);

    useEffect(() => {
        if (!isBioAuthEnabled) return;
        if (!isBioAuthAvailable) return;
        if (!isBioAuthValidationRequired) return;
        if (!isWindowFocused) return;
        if (isCallInProgress) return;
        if (cancelled) return;

        requestBioAuthValidation();
    }, [
        isBioAuthAvailable,
        isBioAuthEnabled,
        isBioAuthValidationRequired,
        isWindowFocused,
        isCallInProgress,
        cancelled,
        requestBioAuthValidation,
    ]);

    return isBioAuthEnabled && isBioAuthValidationRequired ? (
        <BioAuthOverlay
            isBioAuthAvailable={isBioAuthAvailable}
            onPrimaryButtonClick={requestBioAuthValidation}
        />
    ) : (
        children
    );
};
