import styled from 'styled-components';

import { Image, variables } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

const Wrapper = styled.div`
    display: flex;
    gap: 24px;
    width: 100%;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
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
`;

const Content = styled.div`
    flex-grow: 1;
`;

interface SecurityCheckLayoutProps {
    children: React.ReactNode;
}

export const SecurityCheckLayout = ({ children }: SecurityCheckLayoutProps) => {
    const device = useSelector(selectDevice);

    const deviceModelInternal = device?.features?.internal_model;

    return (
        <Wrapper>
            {deviceModelInternal && (
                <ImageWrapper>
                    <StyledImage image={`TREZOR_${deviceModelInternal}_LARGE`} />
                </ImageWrapper>
            )}
            <Content>{children}</Content>
        </Wrapper>
    );
};
