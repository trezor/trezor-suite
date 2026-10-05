import styled from 'styled-components';

import { avatarHue, avatarInitials } from 'src/utils/contacts/avatar';

// The design system has no avatar or identicon, so a contact gets a colour disc whose hue is hashed
// from its identity: the same npub always has the same colour. Suite never fetches Nostr profile
// pictures, because that would be an outbound request per contact.

const Disc = styled.div<{ $hue: number; $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-variant-numeric: tabular-nums;
    background: ${({ $hue }) =>
        `linear-gradient(135deg, hsl(${$hue} 62% 46%), hsl(${($hue + 42) % 360} 64% 56%))`};
`;

const Glyph = styled.span<{ $size: number }>`
    font-size: ${({ $size }) => Math.round($size * 0.38)}px;
    font-weight: 600;
    line-height: 1;
`;

type ContactAvatarProps = {
    /** The npub (or any stable identity string) the colour is derived from. */
    seed: string;
    /** Contact name; its initials are shown on the disc. */
    label?: string;
    size?: number;
};

export const ContactAvatar = ({ seed, label = '', size = 40 }: ContactAvatarProps) => (
    <Disc $hue={avatarHue(seed)} $size={size}>
        <Glyph $size={size}>{avatarInitials(label) || '·'}</Glyph>
    </Disc>
);
