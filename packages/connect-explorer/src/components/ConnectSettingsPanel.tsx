import { useCallback, useEffect, useState } from 'react';

import styled, { css, keyframes } from 'styled-components';

import { Icon, IconButton, Text } from '@trezor/components';
import { CheckIcon, XIcon } from '@trezor/icons';

import { ConnectInitForm } from './ConnectInitForm';

// How long the success screen lingers before switching back to the method.
const SUCCESS_HOLD_MS = 1400;

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const successFade = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`;

const popIn = keyframes`
    0% {
        opacity: 0;
        transform: scale(0.8);
    }
    60% {
        transform: scale(1.04);
    }
    100% {
        opacity: 1;
        transform: scale(1);
    }
`;

const FadeIn = styled.div`
    animation: ${fadeIn} 0.28s ease both;
`;

const FormWrapper = styled.div`
    position: relative;
`;

const CloseButton = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
`;

// The form is only hidden (not unmounted) while the success screen is up, so its values are still
// there if the user reopens the panel.
const FormArea = styled.div<{ $hidden: boolean }>`
    ${({ $hidden }) =>
        $hidden &&
        css`
            display: none;
        `}
`;

// The success screen takes the form's place in the flow rather than covering it: the form is taller
// than the tool's scroll viewport, so a screen centred on the form would land above the visible area
// — the user clicks Initialize at the form's bottom edge.
const SuccessScreen = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 48px 0;
    text-align: center;
    animation: ${successFade} 0.2s ease both;
`;

const SuccessBadge = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${({ theme }) => theme.elementFillBrandBold};
    animation: ${popIn} 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

interface ConnectSettingsPanelProps {
    onClose: () => void;
}

export const ConnectSettingsPanel = ({ onClose }: ConnectSettingsPanelProps) => {
    const [succeeded, setSucceeded] = useState(false);

    // Stable identity so ConnectInitForm's success callback doesn't churn on parent re-renders.
    const handleInitialized = useCallback(() => setSucceeded(true), []);

    // Hold the success screen for a beat, then hand control back to the method (onClose).
    useEffect(() => {
        if (!succeeded) return;
        const timeout = setTimeout(onClose, SUCCESS_HOLD_MS);

        return () => clearTimeout(timeout);
    }, [succeeded, onClose]);

    return (
        <FadeIn>
            <FormWrapper data-testid="@init/settings-panel">
                <CloseButton>
                    <IconButton
                        icon={XIcon}
                        aria-label="Close Connect settings"
                        intent="neutral"
                        priority="secondary"
                        size="small"
                        onClick={onClose}
                        tooltip={{ isActive: false }}
                        data-testid="@init/settings-close"
                    />
                </CloseButton>
                <FormArea $hidden={succeeded}>
                    <ConnectInitForm onInitialized={handleInitialized} />
                </FormArea>
                {succeeded && (
                    <SuccessScreen data-testid="@init/success-screen">
                        <SuccessBadge>
                            <Icon as={CheckIcon} size={32} color="contentOnDarkBrand" />
                        </SuccessBadge>
                        <Text typographyStyle="body-md-strong">Success</Text>
                    </SuccessScreen>
                )}
            </FormWrapper>
        </FadeIn>
    );
};
