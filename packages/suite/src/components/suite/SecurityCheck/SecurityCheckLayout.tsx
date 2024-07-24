import styled from 'styled-components';

import { Image, variables } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 24px;
    width: 100%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        grid-template-columns: 1fr;
        flex-direction: column;
    }
`;

const ImageWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: 12px;
    padding: 32px;
`;

const StyledImage = styled(Image)`
    max-height: 300px;

    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
`;

const Content = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`;

interface SecurityCheckLayoutProps {
    isFailed?: boolean;
    children: React.ReactNode;
}

export const SecurityCheckLayout = ({ isFailed, children }: SecurityCheckLayoutProps) => {
    const device = useSelector(selectDevice);

    const deviceModelInternal = device?.features?.internal_model;
    const imageVariant = isFailed ? 'GHOST' : 'LARGE';

    return (
        <Wrapper>
            {deviceModelInternal && (
                <ImageWrapper>
                    <StyledImage image={`TREZOR_${deviceModelInternal}_${imageVariant}`} />
                </ImageWrapper>
            )}
            <Content>{children}</Content>
        </Wrapper>
    );
};
