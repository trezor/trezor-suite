import { useEffect, useRef } from 'react';

import styled from 'styled-components';

import { Button, Icon, Paragraph, Row, useElevation } from '@trezor/components';
import { isMacOs } from '@trezor/env-utils';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import { bioAuthActions } from 'src/actions/suite/bioAuthActions';
import {
    bioAuthWindowBlurThunk,
    bioAuthWindowFocusThunk,
    requestBioAuthValidationThunk,
} from 'src/actions/suite/bioAuthThunks';
import { Translation } from 'src/components/suite';
import {
    Body,
    Columns,
    MainContent,
    PageWrapper,
    Wrapper,
} from 'src/components/suite/layouts/SuiteLayout/SuiteLayout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectBioAuthEnabled,
    selectIsAppUiHidden,
    selectIsBioAuthValidationRequired,
} from 'src/reducers/bioAuth';

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
    isBioAuthValidationRequired,
}: {
    isBioAuthValidationRequired: boolean;
}) => {
    const dispatch = useDispatch();
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
                                {isBioAuthValidationRequired ? (
                                    <Container $elevation={elevation}>
                                        <Icon name="lockFilled" />
                                        <Paragraph typographyStyle="titleSmall">
                                            <Translation id="TR_BIO_AUTH_LOCKED_HEADING" />
                                        </Paragraph>
                                        <Paragraph typographyStyle="body">
                                            {isMacOs() ? (
                                                <Translation id="TR_BIO_AUTH_LOCKED_TEXT_MAC" />
                                            ) : (
                                                <Translation id="TR_BIO_AUTH_LOCKED_TEXT_WIN" />
                                            )}
                                        </Paragraph>
                                        <Button
                                            isFullWidth
                                            variant="primary"
                                            onClick={() =>
                                                dispatch(requestBioAuthValidationThunk())
                                            }
                                        >
                                            <Translation id="TR_BIO_AUTH_UNLOCK" />
                                        </Button>
                                    </Container>
                                ) : (
                                    <Icon name="eyeSlashFilled" />
                                )}
                            </Row>
                        </MainContent>
                    </Columns>
                </Body>
            </PageWrapper>
        </Wrapper>
    );
};

export const BioAuthGuard = ({ children }: { children: React.ReactNode }) => {
    const isBioAuthValidationRequired = useSelector(state =>
        selectIsBioAuthValidationRequired(state, new Date()),
    );
    const isBioAuthAvailable = useSelector(selectBioAuthEnabled);
    const isAppUiHidden = useSelector(selectIsAppUiHidden);
    const dispatch = useDispatch();

    useEffect(() => {
        if (!isBioAuthAvailable) {
            return;
        }
        dispatch(bioAuthActions.initBioAuth(performance.now()));

        const handleBlur = () => {
            dispatch(bioAuthWindowBlurThunk(new Date()));
        };

        const handleFocus = () => {
            dispatch(bioAuthWindowFocusThunk(new Date()));
        };

        window.addEventListener('blur', handleBlur);

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [dispatch, isBioAuthAvailable]);

    return isAppUiHidden || isBioAuthValidationRequired ? (
        <BioAuthOverlay isBioAuthValidationRequired={isBioAuthValidationRequired} />
    ) : (
        children
    );
};
