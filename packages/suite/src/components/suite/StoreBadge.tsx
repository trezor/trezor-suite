import { TrezorLink } from '@suite/external-links';
import { Box, Row, SvgImage } from '@trezor/components';
import { borders } from '@trezor/theme';

type StoreBadgeImageKey = 'APP_STORE' | 'PLAY_STORE';

type StoreBadgeProps = {
    url: string;
    image: StoreBadgeImageKey;
    onClick?: () => void;
};

export const StoreBadge = ({ url, image, onClick }: StoreBadgeProps) => (
    <TrezorLink href={url} onClick={onClick}>
        <Box
            padding={{ horizontal: 12 }}
            height={44}
            cursor="pointer"
            borderRadius={borders.radii.sm}
            backgroundColor="elementFillNeutralSoft"
            backgroundColorOnInteraction="elementFillNeutralSoftHovered"
        >
            <Row alignItems="center" height="100%">
                <SvgImage image={image} height={26} color="contentNeutral" />
            </Row>
        </Box>
    </TrezorLink>
);
