import messages from '@trezor/suite/src/support/messages';

export const cardanoAccountDetails = (platform: string) => `
    - text: Account type
    - paragraph:
      - paragraph: ${messages['TR_ACCOUNT_TYPE_NORMAL_CARDANO_DESC'].defaultMessage}
    - text: Default
    - paragraph: (Shelley)
    - text: Derivation path
    - paragraph: ${messages['TR_ACCOUNT_DETAILS_PATH_DESC'].defaultMessage}
    - link "Learn more":
      - /url: https://trezor.io/learn/advanced/standards-proposals/what-is-bip32?utm_medium=${platform}
      - text: Learn more
      - img
    - paragraph: m/1852'/1815'/0'
    - text: Public key (XPUB)
    - paragraph: ${messages['TR_ACCOUNT_DETAILS_XPUB'].defaultMessage}
    - link "Learn more":
      - /url: https://trezor.io/learn/supported-assets/bitcoin/what-is-a-public-key-xpub?utm_medium=${platform}
      - text: Learn more
      - img
    - button "Show public key"
`;
