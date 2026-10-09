import { useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { injectDispatch } from '@suite-common/redux-utils';
import { Button, Icon, Paragraph, Row, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { isMacOs } from '@trezor/env-utils';
import { LockFilledIcon } from '@trezor/icons';

import {
    Body,
    Columns,
    MainContent,
    PageWrapper,
    Wrapper,
} from 'src/components/suite/layouts/SuiteLayout/SuiteLayout';
import { useBioAuthDesktopApi } from 'src/hooks/suite/useBioAuthDesktopApi';

const Container = styled.div`
    display: flex;
    border: 1px solid ${({ theme }) => theme.surfaceBorderRaised};
    gap: 4px;
    align-items: center;
    width: 334px;
    height: 212px;
    background: ${({ theme }) => theme.surfaceFillRaised};
    border-radius: 20px;
    flex-direction: column;
    justify-content: space-between;
    user-select: none;
    padding: 12px 4px;
`;

type BioAuthOverlayProps = {
    isBioAuthAvailable: boolean;
    onPrimaryButtonClick: () => void;
};

const BioAuthOverlay = ({ isBioAuthAvailable, onPrimaryButtonClick }: BioAuthOverlayProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

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
                                <Container>
                                    <Icon as={LockFilledIcon} />
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

type BioAuthGuardProps = { children: React.ReactNode };

export const BioAuthGuard = ({ children }: BioAuthGuardProps) => {
    const [isWindowFocused, setIsWindowFocused] = useState(true);

    const {
        isBioAuthAvailable,
        isBioAuthEnabled,
        isBioAuthValidationRequired,
        requestBioAuthValidation,
        isCallInProgress,
        cancelled,
    } = useBioAuthDesktopApi();

    const { dispatch } = useServices(injectDispatch);

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
