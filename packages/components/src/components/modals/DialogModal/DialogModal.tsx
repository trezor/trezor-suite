import styled from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { IconName } from '@suite-common/icons';
import { Icon } from '@suite-common/icons/src/webComponents';
import { Modal, ModalProps } from '../Modal/Modal';
import { ReactNode } from 'react';

const BodyHeading = styled.div`
    margin-bottom: ${spacingsPx.xs};
    ${typography.titleMedium}
`;

const StyledIcon = styled(Icon)<{ iconVariant: 'success' | 'warning' }>`
    width: 80px;
    height: 80px;
    margin-bottom: ${spacingsPx.md};
    background: ${({ theme, iconVariant }) => {
        switch (iconVariant) {
            case 'warning':
                return theme.backgroundAlertYellowSubtleOnElevation1;
            case 'success':
            default:
                return theme.backgroundPrimarySubtleOnElevation1;
        }
    }};
    border-radius: ${borders.radii.full};
`;

const Body = styled.p`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

type PickedModalProps = Pick<
    ModalProps,
    | 'onCancel'
    | 'isCancelable'
    | 'bottomBarComponents'
    | 'currentProgressBarStep'
    | 'totalProgressBarSteps'
    | 'className'
    | 'data-testid'
>;

export interface DialogModalProps extends PickedModalProps {
    headerHeading?: ReactNode;
    bodyHeading?: ReactNode;
    icon?: IconName;
    iconVariant?: 'success' | 'warning';
    body?: ReactNode;
}

export const DialogModal = ({
    headerHeading,
    bodyHeading,
    icon,
    iconVariant = 'success',
    body,
    ...rest
}: DialogModalProps) => (
    <Modal heading={headerHeading} {...rest}>
        {icon && <StyledIcon name={icon} size="extraLarge" iconVariant={iconVariant} />}
        {bodyHeading && <BodyHeading>{bodyHeading}</BodyHeading>}
        <Body>{body}</Body>
    </Modal>
);
