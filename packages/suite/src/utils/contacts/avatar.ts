// The design system has no avatar or identicon component, so the contact list derives a colour and
// initials from the contact. A label can be any UTF-8 string, so these helpers iterate by code
// point: indexing UTF-16 code units would split an emoji or other astral-plane character.

/** Stable hue (0-359) hashed from the seed: the same npub always gets the same colour. */
export const avatarHue = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) % 360;
    }

    return hash;
};

/**
 * Up to two uppercase initials: the first letters of the first two words, or the first two
 * characters of a single word. Empty for a blank label, so the caller can fall back.
 */
export const avatarInitials = (label: string) => {
    const [firstWord, secondWord] = label.trim().split(/\s+/).filter(Boolean);
    if (!firstWord) return '';
    if (!secondWord) return Array.from(firstWord).slice(0, 2).join('').toUpperCase();

    return ((Array.from(firstWord)[0] ?? '') + (Array.from(secondWord)[0] ?? '')).toUpperCase();
};
