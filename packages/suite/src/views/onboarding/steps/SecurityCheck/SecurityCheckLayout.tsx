import styled from 'styled-components';

import { Image } from '@trezor/components';
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
    flex-shrink: 0;
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: 12px;
    padding: 32px;
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
                    <Image image={`TREZOR_${deviceModelInternal}_2x`} />
                </ImageWrapper>
            )}
            <div>{children}</div>
        </Wrapper>
    );
};
