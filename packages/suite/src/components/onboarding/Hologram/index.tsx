import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { DeviceAnimation } from '@onboarding-components';
import { Translation, TrezorLink } from '@suite/components/suite';
import {
    TREZOR_PACKAGING_URL,
    TREZOR_RESELLERS_URL,
    SUPPORT_URL,
} from '@suite/constants/suite/urls';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const HologramHeading = styled.span`
    /* color: ${props => props.theme.TYPE_LIGHT_GREY}; */
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 16px;
`;

const HologramSubHeading = styled.span`
    /* color: ${props => props.theme.TYPE_LIGHT_GREY}; */
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 16px;
`;

const AnimationWrapper = styled.div`
    margin: 8px 0px;
`;

const Warning = styled.div`
    color: ${props => props.theme.TYPE_ORANGE};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 12px 18px;
    border-radius: 4px;
    background: ${props => props.theme.BG_LIGHT_GREY};
`;

interface Props {
    trezorModel?: string;
}
const Hologram = ({ trezorModel }: Props) => (
    <Wrapper>
        <HologramHeading>
            <Translation id="TR_HOLOGRAM_STEP_HEADING" />
        </HologramHeading>

        <HologramSubHeading>
            <Translation id="TR_HOLOGRAM_STEP_SUBHEADING" />
        </HologramSubHeading>

        <AnimationWrapper>
            <DeviceAnimation type="HOLOGRAM" version={trezorModel} shape="ROUNDED-SMALL" loop />
        </AnimationWrapper>

        <Warning>
            <Translation
                id="TR_DID_YOU_PURCHASE"
                values={{
                    TR_PACKAGING_LINK: (
                        <TrezorLink href={TREZOR_PACKAGING_URL} variant="underline">
                            <Translation id="TR_PACKAGING_LINK" />
                        </TrezorLink>
                    ),
                    TR_RESELLERS_LINK: (
                        <TrezorLink href={TREZOR_RESELLERS_URL} variant="underline">
                            <Translation id="TR_RESELLERS_LINK" />
                        </TrezorLink>
                    ),
                    TR_CONTACT_OUR_SUPPORT_LINK: (
                        <TrezorLink href={SUPPORT_URL} variant="underline">
                            <Translation id="TR_CONTACT_OUR_SUPPORT_LINK" />
                        </TrezorLink>
                    ),
                }}
            />
        </Warning>
    </Wrapper>
);

export default Hologram;
