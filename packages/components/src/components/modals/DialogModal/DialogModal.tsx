import styled from 'styled-components';
import { borders, spacingsPx, typography } from '@trezor/theme';
import { Icon, IconName } from '../../Icon/Icon';
import { Modal, ModalProps } from '../Modal/Modal';
import { ReactNode } from 'react';

const BodyHeading = styled.div`
    margin-bottom: ${spacingsPx.xs};
    ${typography.titleMedium}
`;

const IconWrapper = styled.div<{ $iconVariant: 'success' | 'warning' }>`
    width: 80px;
    height: 80px;
    margin-bottom: ${spacingsPx.md};
    background: ${({ theme, $iconVariant }) => {
        switch ($iconVariant) {
            case 'warning':
                return theme.backgroundAlertYellowSubtleOnElevation1;
            case 'success':
            default:
                return theme.backgroundPrimarySubtleOnElevation1;
        }
    }};
    border-radius: ${borders.radii.full};
    display: flex;
    justify-content: center;
    align-items: center;
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

/**
 * @deprecated Use NewModal.
 */
export const DialogModal = ({
    headerHeading,
    bodyHeading,
    icon,
    iconVariant = 'success',
    body,
    ...rest
}: DialogModalProps) => (
    <Modal heading={headerHeading} {...rest}>
        {icon && (
            <IconWrapper $iconVariant={iconVariant}>
                <Icon name={icon} size="extraLarge" />
            </IconWrapper>
        )}
        {bodyHeading && <BodyHeading>{bodyHeading}</BodyHeading>}
        <Body>{body}</Body>
    </Modal>
);
