import styled from 'styled-components';

import { Paragraph, Image, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { borders } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    text-align: left;
    background: ${({ theme }) => theme.BG_GREY};
    align-items: center;
    border-radius: ${borders.radii.xs};
    width: 100%;
    justify-content: space-between;
`;

const Col = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    text-align: left;
`;

const ContentCol = styled(Col)`
    padding: 16px 24px;
`;

const ImageCol = styled(Col)`
    padding: 16px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

interface DeviceDisconnectedProps {
    label: string;
}

export const DeviceDisconnected = ({ label, ...rest }: DeviceDisconnectedProps) => (
    <Wrapper {...rest}>
        <ContentCol>
            <Paragraph type="hint">
                <Translation
                    id="TR_DEVICE_LABEL_IS_NOT_CONNECTED"
                    values={{ deviceLabel: label }}
                />
            </Paragraph>
            <Paragraph type="label">
                <Translation id="TR_PLEASE_CONNECT_YOUR_DEVICE" />
            </Paragraph>
        </ContentCol>
        <ImageCol>
            <Image image="UNI_ERROR" />
        </ImageCol>
    </Wrapper>
);
