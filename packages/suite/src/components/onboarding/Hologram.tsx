import styled from 'styled-components';

import { selectDevice } from '@suite-common/wallet-core';
import { getPackagingUrl } from '@suite-common/suite-utils';
import { DeviceAnimation, Warning, variables } from '@trezor/components';
import { TREZOR_RESELLERS_URL, TREZOR_SUPPORT_URL } from '@trezor/urls';

import { Translation, TrezorLink } from 'src/components/suite';
import { useRef } from 'react';
import { useSelector } from 'src/hooks/suite';

const HologramSubHeading = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 16px;
`;

const AnimationWrapper = styled.div`
    margin: 8px 0;
`;

const StyledWarning = styled(Warning)`
    width: calc(100% + 16px);
    margin: 0 -8px;
    font-size: ${variables.FONT_SIZE.TINY};

    a {
        color: ${({ theme }) => theme.backgroundAlertYellowBold};
    }
`;

export const Hologram = () => {
    const device = useSelector(selectDevice);

    const packagingUrl = getPackagingUrl(device);
    const hologramRef = useRef<HTMLVideoElement>(null);

    return (
        <>
            <HologramSubHeading>
                <Translation id="TR_HOLOGRAM_STEP_SUBHEADING" />
            </HologramSubHeading>

            <AnimationWrapper>
                <DeviceAnimation
                    type="HOLOGRAM"
                    shape="ROUNDED-SMALL"
                    loop
                    width="100%"
                    deviceModelInternal={device?.features?.internal_model}
                    onVideoMouseOver={() => {
                        // If the video is placed in tooltip it stops playing after tooltip minimizes and won't start again
                        // As a quick workaround user can hover a mouse to play it again
                        hologramRef.current?.play();
                    }}
                    ref={hologramRef}
                />
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
