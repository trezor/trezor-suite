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

const StyledIcon = styled(Icon)`
    width: 80px;
    height: 80px;
    margin-bottom: ${spacingsPx.md};
    background: ${({ theme }) => theme.backgroundPrimarySubtleOnElevation1};
    border-radius: ${borders.radii.full};
`;

const Text = styled.p`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

type PickedModalProps = Pick<
    ModalProps,
    | 'onCancel'
    | 'isCancelable'
    | 'bottomBarComponents'
    | 'currentProgressStep'
    | 'totalProgressSteps'
    | 'className'
    | 'data-test'
>;

export interface DialogModalProps extends PickedModalProps {
    headerHeading?: ReactNode;
    bodyHeading?: ReactNode;
    icon?: IconName;
    text?: ReactNode;
}

export const DialogModal = ({
    headerHeading,
    bodyHeading,
    icon,
    text,
    ...rest
}: DialogModalProps) => (
    <Modal heading={headerHeading} {...rest}>
        {icon && <StyledIcon name={icon} size="extraLarge" />}
        {bodyHeading && <BodyHeading>{bodyHeading}</BodyHeading>}
        <Text> {text}</Text>
    </Modal>
);
