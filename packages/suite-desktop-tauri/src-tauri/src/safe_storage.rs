//! safe-storage — Tauri equivalent of Electron `modules/safeStorage.ts` (Electron `safeStorage`,
//! i.e. Chromium os_crypt): a random 256-bit key lives in the OS keychain (macOS Keychain /
//! Secret Service on Linux / Windows Credential Manager via the `keyring` crate) and values are
//! encrypted with AES-256-GCM. Result values are hex strings, matching the Electron module.
//!
//! Insecure-backend note (parity with Electron's `basic_text` refusal): the `keyring` crate's
//! native backends store in the OS-encrypted keyring (macOS Keychain, Windows Credential Manager,
//! Linux Secret Service). Unlike Chromium os_crypt it does NOT silently fall back to a plaintext
//! store — when no secure backend is available the calls below return `Err`, which we surface as
//! `EncryptionUnavailable` (never a silent `success`). So the master key is never written in
//! cleartext: either it lands in the encrypted keyring or encryption is reported unavailable.

use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use serde_json::{json, Value};

const SERVICE: &str = "Trezor Suite Tauri";
const ACCOUNT: &str = "safe-storage";

fn encryption_unavailable(message: &str) -> Value {
    json!({
        "success": false,
        "error": { "type": "EncryptionUnavailable", "message": message },
    })
}

fn decryption_failed() -> Value {
    json!({ "success": false, "error": { "type": "DecryptionFailed" } })
}

fn get_or_create_key() -> Result<[u8; 32], String> {
    let entry = keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(hex_key) => {
            let bytes = hex_decode(&hex_key).ok_or("stored key is not valid hex")?;
            bytes.try_into().map_err(|_| "stored key has wrong length".to_string())
        }
        Err(keyring::Error::NoEntry) => {
            let key = Aes256Gcm::generate_key(OsRng);
            let key_bytes: [u8; 32] = key.into();
            entry
                .set_password(&hex_encode(&key_bytes))
                .map_err(|e| e.to_string())?;
            Ok(key_bytes)
        }
        Err(e) => Err(e.to_string()),
    }
}

pub fn encrypt(value: &str) -> Value {
    let key_bytes = match get_or_create_key() {
        Ok(k) => k,
        Err(e) => return encryption_unavailable(&format!("keychain unavailable: {e}")),
    };
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
    let nonce = Aes256Gcm::generate_nonce(OsRng);
    match cipher.encrypt(&nonce, value.as_bytes()) {
        Ok(ciphertext) => {
            let mut out = nonce.to_vec();
            out.extend(ciphertext);
            json!({ "success": true, "payload": hex_encode(&out) })
        }
        Err(_) => encryption_unavailable("encryption failed"),
    }
}

pub fn decrypt(value_hex: &str) -> Value {
    let key_bytes = match get_or_create_key() {
        Ok(k) => k,
        Err(e) => return encryption_unavailable(&format!("keychain unavailable: {e}")),
    };
    let Some(data) = hex_decode(value_hex) else {
        return decryption_failed();
    };
    if data.len() < 12 {
        return decryption_failed();
    }
    let (nonce, ciphertext) = data.split_at(12);
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
    match cipher.decrypt(Nonce::from_slice(nonce), ciphertext) {
        Ok(plain) => match String::from_utf8(plain) {
            Ok(s) => json!({ "success": true, "payload": s }),
            Err(_) => decryption_failed(),
        },
        Err(_) => decryption_failed(),
    }
}

fn hex_encode(data: &[u8]) -> String {
    data.iter().map(|b| format!("{b:02x}")).collect()
}

fn hex_decode(s: &str) -> Option<Vec<u8>> {
    if s.len() % 2 != 0 {
        return None;
    }
    (0..s.len())
        .step_by(2)
        .map(|i| u8::from_str_radix(&s[i..i + 2], 16).ok())
        .collect()
}
