import styled from 'styled-components';

import { Image } from '@trezor/components';

import { Modal, Translation } from 'src/components/suite';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
    margin: 20px;
`;

const StyledModal = styled(Modal)`
    width: 600px;
`;

interface DatabaseUpgradeModalProps {
    variant: 'blocking' | 'blocked';
}

export const DatabaseUpgradeModal = ({ variant }: DatabaseUpgradeModalProps) => {
    const heading =
        variant === 'blocked' ? 'TR_DATABASE_UPGRADE_BLOCKED' : 'TR_THIS_INSTANCE_IS_BLOCKING';

    return (
        <StyledModal
            heading={<Translation id={heading} />}
            description={<Translation id="TR_RUNNING_MULTIPLE_INSTANCES" />}
        >
            <ImageWrapper>
                <Image image="DEVICE_ANOTHER_SESSION" width="250" />
            </ImageWrapper>
        </StyledModal>
    );
};
