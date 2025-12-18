import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import { Banner } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

import { MessageSystemBanner } from '../MessageSystemBanner';

const Container = styled.div<{ $fill?: boolean }>`
    width: 100%;
    max-width: ${({ $fill }) => ($fill ? 'none' : MAX_CONTENT_WIDTH)};
    max-height: 20vh;
    overflow: auto;
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xs};
    position: relative; /* because it must be on the top of the draggable area on Mac */
`;

type SuiteBannersProps = {
    isOnboarding?: boolean;
    fill?: boolean;
};

export const FrozenAppBanner = () => (
    <Banner icon intent="critical">
        You are using a frozen version of Trezor Suite. This version is intended only to carry out
        firmware update of Trezor One devices
    </Banner>
);

export const SuiteBanners = ({ isOnboarding, fill }: SuiteBannersProps) => {
    const bannerMessage = useSelector(selectBannerMessage);

    if (isOnboarding) {
        return bannerMessage ? (
            <Container $fill={fill}>
                <MessageSystemBanner message={bannerMessage} />
            </Container>
        ) : null;
    }

    const priority = 0;

    // message system banners should always be visible in the app even if app body is blurred
    const isMessageSystemBannerVisible = bannerMessage && bannerMessage.priority >= priority;

    return (
        <Container $fill={fill}>
            {isMessageSystemBannerVisible && <MessageSystemBanner message={bannerMessage} />}
            {!isMessageSystemBannerVisible && <FrozenAppBanner />}
            {/* TODO: add Pin not set */}
        </Container>
    );
};
