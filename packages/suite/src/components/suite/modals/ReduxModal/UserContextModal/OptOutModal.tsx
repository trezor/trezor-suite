import { ReactNode, useState } from 'react';
import styled from 'styled-components';
import { Button, Image } from '@trezor/components';
import { Translation, CheckItem, Modal } from 'src/components/suite';
import { TranslationKey } from '@suite-common/intl-types';
import { spacingsPx } from '@trezor/theme';

const CheckboxWrapper = styled.div`
    margin-top: ${spacingsPx.xxl};
`;

const StyledModal = styled(Modal)`
    width: 600px;
    ${Modal.Content} {
        justify-content: center;
        align-items: center;
    }
`;

const WarningImage = styled(Image)`
    margin: ${spacingsPx.xl} 0;
`;

const Content = styled.div`
    margin-top: ${spacingsPx.md};
    margin-bottom: ${spacingsPx.md};
`;

type OptOutModalProps = {
    onCancel: () => void;
    headingKey: TranslationKey;
    confirmKey: TranslationKey;
    checkboxLabelKey: TranslationKey;
    'data-test': string;
    onChange: (props: { isDisabled: boolean }) => void;
    children: ReactNode;
};

export const OptOutModal = ({
    onCancel,
    headingKey,
    confirmKey,
    checkboxLabelKey,
    'data-test': dataTest,
    onChange,
    children,
}: OptOutModalProps) => {
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleTurningOffRevisionCheck = () => {
        onChange({ isDisabled: true });
        onCancel();
    };

    return (
        <StyledModal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id={headingKey} />}
            bottomBarComponents={
                <Button
                    variant="destructive"
                    onClick={handleTurningOffRevisionCheck}
                    isDisabled={!isConfirmed}
                    data-test={`${dataTest}/opt-out-button`}
                >
                    <Translation id={confirmKey} />
                </Button>
            }
        >
            <WarningImage image="UNI_ERROR" />

            <Content>{children}</Content>

            <CheckboxWrapper>
                <CheckItem
                    title={<Translation id={checkboxLabelKey} />}
                    isChecked={isConfirmed}
                    onClick={() => setIsConfirmed(!isConfirmed)}
                    data-test={`${dataTest}/checkbox`}
                />
            </CheckboxWrapper>
        </StyledModal>
    );
};
