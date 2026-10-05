// Legacy transaction messages built with @solana/kit and the @solana-program instruction builders.
// The fee payer is m/44'/501'/0'/0' of the "all all ..." seed, the mint is USDC and every token
// transfer moves 1 USDC from the fee payer's associated token account.
export const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

export const RECIPIENT = '7tark5iZaRrMfGKtKy1aqpGuRgoxbE6ec7Z5Qa4Jc5xr';
// Associated token account of RECIPIENT for MINT.
export const RECIPIENT_TOKEN_ACCOUNT = 'Cbaz6s2wbBKnQguE73H2VtGSsjX89W3Xa9cFRHkaKKJE';
// Associated token account of another owner for MINT.
export const OTHER_TOKEN_ACCOUNT = '3KnnF7vrVt3zToi9RegZ18Wx5XGDsFaBiPDcnK9Qwvnw';

// A transferChecked to RECIPIENT_TOKEN_ACCOUNT.
export const tokenTransferTx =
    '0100020500d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88adac4cbae79d1b0a4292e1f65806ab8e718d3afbd94a0bf1b3169a673a932f5c2f0393bc2794936d1242ade39af7fb3c4000c483a3097d9c37c1f0864669d00a3fc6fa7af3bedbad3a3d65f36aabc97431b1bbe4c2d2f6e0e47ca60203452f5d6106ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9395bf727f9aac5e80911591073fcf9c826f428804131ca089beba3869421749a010404020301000a0c40420f000000000006';

// A transferChecked to OTHER_TOKEN_ACCOUNT.
export const tokenTransferToOtherAccountTx =
    '0100020500d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad228797937af96dd812800a3f4cf0b7609b0ca7bff4722e728babb361a14b64bc0393bc2794936d1242ade39af7fb3c4000c483a3097d9c37c1f0864669d00a3fc6fa7af3bedbad3a3d65f36aabc97431b1bbe4c2d2f6e0e47ca60203452f5d6106ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9395bf727f9aac5e80911591073fcf9c826f428804131ca089beba3869421749a010404020301000a0c40420f000000000006';
