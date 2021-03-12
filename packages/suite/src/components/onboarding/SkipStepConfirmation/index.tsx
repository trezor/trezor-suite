import React from 'react';
import styled from 'styled-components';
import { Button, variables } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { useOnboarding } from '@suite-hooks';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 16px 0px;
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;

    button + button {
        margin-left: 24px;
    }
`;

interface Props {
    variant: 'backup' | 'pin';
    onCancel: () => void;
}

const getVariant = (variant: Props['variant']) => {
    if (variant === 'backup') {
        return {
            heading: <Translation id="TR_SKIP_BACKUP" />,
            skipCtaLabel: <Translation id="TR_SKIP_BACKUP" />,
            children: <Translation id="TR_DO_YOU_REALLY_WANT_TO_SKIP" />,
        };
    }
    return {
        heading: <Translation id="TR_SKIP_PIN" />,
        skipCtaLabel: <Translation id="TR_SKIP_PIN" />,
        children: <Translation id="TR_DO_YOU_REALLY_WANT_TO_SKIP" />,
    };
};

const SkipStepConfirmation = ({ variant, onCancel }: Props) => {
    const { goToStep } = useOnboarding();
    const { children, heading, skipCtaLabel } = getVariant(variant);

    return (
        <Modal
            size="small"
            cancelable
            heading={heading}
            onCancel={() => onCancel()}
            bottomBar={
                <Buttons>
                    <Button
                        fullWidth
                        variant="danger"
                        data-test="@onboarding/skip-button-confirm"
                        onClick={() => goToStep(variant === 'backup' ? 'set-pin' : 'coins')}
                    >
                        {skipCtaLabel}
                    </Button>
                    <Button fullWidth variant="secondary" onClick={() => onCancel()}>
                        <Translation id="TR_DONT_SKIP" />
                    </Button>
                </Buttons>
            }
        >
            <Wrapper>{children}</Wrapper>
        </Modal>
    );
};

export default SkipStepConfirmation;
