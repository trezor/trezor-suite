import React from 'react';
import styled from 'styled-components';

import { DeviceAnimation } from 'src/components/onboarding';
import { Warning, variables } from '@trezor/components';
import { TREZOR_RESELLERS_URL, TREZOR_SUPPORT_URL } from '@trezor/urls';
import { Translation, TrezorLink } from 'src/components/suite';
import type { TrezorDevice } from 'src/types/suite';
import { getPackagingUrl } from 'src/utils/suite/device';

const HologramSubHeading = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 16px;
`;

const AnimationWrapper = styled.div`
    margin: 8px 0px;
`;

const StyledWarning = styled(Warning)`
    width: calc(100% + 16px);
    margin: 0px -8px;
    font-size: ${variables.FONT_SIZE.TINY};

    a {
        color: ${({ theme }) => theme.backgroundAlertYellowBold};
    }
`;

interface HologramProps {
    device?: TrezorDevice;
}

export const Hologram = ({ device }: HologramProps) => {
    const packagingUrl = getPackagingUrl(device);

    return (
        <>
            <HologramSubHeading>
                <Translation id="TR_HOLOGRAM_STEP_SUBHEADING" />
            </HologramSubHeading>

            <AnimationWrapper>
                <DeviceAnimation type="HOLOGRAM" shape="ROUNDED-SMALL" loop device={device} />
            </AnimationWrapper>

            <StyledWarning>
                <Translation
                    id="TR_DID_YOU_PURCHASE"
                    values={{
                        TR_PACKAGING_LINK: (
                            <TrezorLink href={packagingUrl} variant="underline">
                                <Translation id="TR_PACKAGING_LINK" />
                            </TrezorLink>
                        ),
                        TR_RESELLERS_LINK: (
                            <TrezorLink href={TREZOR_RESELLERS_URL} variant="underline">
                                <Translation id="TR_RESELLERS_LINK" />
                            </TrezorLink>
                        ),
                        TR_CONTACT_OUR_SUPPORT_LINK: (
                            <TrezorLink href={TREZOR_SUPPORT_URL} variant="underline">
                                <Translation id="TR_CONTACT_OUR_SUPPORT_LINK" />
                            </TrezorLink>
                        ),
                    }}
                />
            </StyledWarning>
        </>
    );
};
