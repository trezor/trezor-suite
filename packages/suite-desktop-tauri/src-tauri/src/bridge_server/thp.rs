//! THP (Trezor-Host-Protocol, protocol v2) TRANSPORT FRAMING ONLY — the Rust port of the pieces of
//! `@trezor/protocol/protocol-thp` + `@trezor/transport-common/thp` that the BRIDGE uses.
//!
//! Crucially, the bridge does NOT decrypt/encrypt THP. AES-GCM keys never reach it and are not part
//! of the `thpState` it round-trips. The bridge only does: 64-byte report chunking (0x80+channel
//! continuation), CRC32 validation, header/control-byte parsing, the ACK handshake, and the
//! sync/ack-bit + expected-response state machine — all over opaque payload bytes. The frontend
//! (connect Core) does the crypto and hands the bridge a fully-built THP frame as hex.

use serde::{Deserialize, Serialize};

pub const CHUNK_SIZE: usize = 64;
const CONTINUATION_PACKET: u8 = 0x80;
const ACK_MESSAGE: u8 = 0x20;
const ENCRYPTED: u8 = 0x04;
const ERROR: u8 = 0x42;
const HANDSHAKE_INIT_REQ: u8 = 0x00;
const HANDSHAKE_INIT_RES: u8 = 0x01;
const HANDSHAKE_COMP_REQ: u8 = 0x02;
const HANDSHAKE_COMP_RES: u8 = 0x03;
const CHANNEL_ALLOCATION_REQ: u8 = 0x40;
const CHANNEL_ALLOCATION_RES: u8 = 0x41;
const ACK_BIT: u8 = 1 << 3; // 0x08
const SEQ_BIT: u8 = 1 << 4; // 0x10

/// The framing/sequencing state the bridge round-trips (ThpState.serialize()). No crypto material.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ThpState {
    #[serde(default)]
    pub properties: serde_json::Value,
    pub channel: String, // 2 bytes hex
    #[serde(rename = "sendBit")]
    pub send_bit: u8,
    #[serde(rename = "recvBit")]
    pub recv_bit: u8,
    #[serde(rename = "sendAckBit")]
    pub send_ack_bit: u8,
    #[serde(rename = "recvAckBit")]
    pub recv_ack_bit: u8,
    #[serde(rename = "sendNonce")]
    pub send_nonce: u64,
    #[serde(rename = "recvNonce")]
    pub recv_nonce: u64,
    #[serde(rename = "expectedResponses", default)]
    pub expected_responses: Vec<u8>,
    #[serde(default)]
    pub credentials: serde_json::Value,
    #[serde(rename = "recentMessage", default)]
    pub recent_message: String,
    #[serde(rename = "piggybackAckEnabled", default)]
    pub piggyback_ack_enabled: bool,
}

impl ThpState {
    fn channel_bytes(&self) -> Vec<u8> {
        hex::decode(&self.channel).unwrap_or_default()
    }
}

/// IEEE 802.3 CRC-32, returned as 4 big-endian bytes (protocol-thp/crypto/crc32.ts).
pub fn crc32_be(data: &[u8]) -> [u8; 4] {
    let mut h = crc32fast::Hasher::new();
    h.update(data);
    h.finalize().to_be_bytes()
}

/// clearControlBit — strip ack + sequence bits to get the base control byte.
fn clear_control_bit(b: u8) -> u8 {
    b & !ACK_BIT & !SEQ_BIT
}

pub struct ThpHeader {
    pub magic: u8, // base control byte
    pub ack_bit: u8,
    pub sequence_bit: u8,
    pub channel: Vec<u8>,
}

/// readThpHeader (protocol-thp/utils.ts). `bytes` = a full THP frame / first report.
pub fn read_thp_header(bytes: &[u8]) -> Result<ThpHeader, String> {
    if bytes.len() < 3 {
        return Err("thp header too short".into());
    }
    Ok(ThpHeader {
        magic: clear_control_bit(bytes[0]),
        ack_bit: (bytes[0] >> 3) & 1,
        sequence_bit: (bytes[0] >> 4) & 1,
        channel: bytes[1..3].to_vec(),
    })
}

/// getExpectedResponses(firstChunk) — the device replies the bridge should expect.
pub fn get_expected_responses(first_chunk: &[u8]) -> Vec<u8> {
    let magic = clear_control_bit(*first_chunk.first().unwrap_or(&0));
    match magic {
        // A ThpCreateChannelRequest expects the device's channel-allocation response. Omitting this
        // made read_one reject the 0x41 reply as UnexpectedMessage, so no THP device (Safe 5/7)
        // could ever allocate a channel. Matches protocol-thp/utils.ts getExpectedResponses.
        CHANNEL_ALLOCATION_REQ => vec![CHANNEL_ALLOCATION_RES],
        HANDSHAKE_INIT_REQ => vec![HANDSHAKE_INIT_RES],
        HANDSHAKE_COMP_REQ => vec![HANDSHAKE_COMP_RES],
        ENCRYPTED => vec![ENCRYPTED],
        _ => vec![],
    }
}

/// isAckExpected — everything is ACKed except channel-allocation request/response.
pub fn is_ack_expected(base_ctrl: u8) -> bool {
    !matches!(base_ctrl, CHANNEL_ALLOCATION_REQ | CHANNEL_ALLOCATION_RES)
}

/// encodeAck(state) — a 9-byte ACK frame `magic ++ channel(2) ++ len(0x0004 BE) ++ crc(4)`.
pub fn encode_ack(state: &ThpState) -> Vec<u8> {
    encode_ack_with_bit(state, state.recv_ack_bit)
}

/// encodePreviousAck(state) — same with the recv-ack bit flipped.
pub fn encode_previous_ack(state: &ThpState) -> Vec<u8> {
    let prev = if state.recv_ack_bit > 0 { 0 } else { 1 };
    encode_ack_with_bit(state, prev)
}

fn encode_ack_with_bit(state: &ThpState, ack_bit: u8) -> Vec<u8> {
    let magic = ACK_MESSAGE | (ack_bit << 3);
    let ch = state.channel_bytes();
    let mut message = Vec::with_capacity(5);
    message.push(magic);
    message.extend_from_slice(&ch);
    message.extend_from_slice(&[0x00, 0x04]); // length = 4 (the CRC only)
    let crc = crc32_be(&message);
    message.extend_from_slice(&crc);
    message
}

/// getCRC(payload) — the trailing 4 CRC bytes.
fn get_crc(payload: &[u8]) -> Vec<u8> {
    if payload.len() >= 4 {
        payload[payload.len() - 4..].to_vec()
    } else {
        vec![]
    }
}

/// Split a full THP frame into 64-byte reports: first report = frame[0..64]; continuation reports
/// = [0x80, ch0, ch1] + next 61 bytes; zero-padded (createChunks with chunkHeader = 0x80++channel).
pub fn create_chunks(frame: &[u8]) -> Vec<[u8; CHUNK_SIZE]> {
    if frame.len() < 3 {
        let mut c = [0u8; CHUNK_SIZE];
        c[..frame.len()].copy_from_slice(frame);
        return vec![c];
    }
    let chunk_header = [CONTINUATION_PACKET, frame[1], frame[2]];
    if frame.len() <= CHUNK_SIZE {
        let mut c = [0u8; CHUNK_SIZE];
        c[..frame.len()].copy_from_slice(frame);
        return vec![c];
    }
    let mut chunks = Vec::new();
    let mut first = [0u8; CHUNK_SIZE];
    first.copy_from_slice(&frame[..CHUNK_SIZE]);
    chunks.push(first);

    let mut pos = CHUNK_SIZE;
    let body = CHUNK_SIZE - chunk_header.len();
    while pos < frame.len() {
        let end = (pos + body).min(frame.len());
        let mut c = [0u8; CHUNK_SIZE];
        c[..chunk_header.len()].copy_from_slice(&chunk_header);
        c[chunk_header.len()..chunk_header.len() + (end - pos)].copy_from_slice(&frame[pos..end]);
        chunks.push(c);
        pos = end;
    }
    chunks
}

/// Reassemble a THP frame from 64-byte reports. First report: [ctrl][ch:2][len:2 BE][payload...].
/// Continuation reports drop the 3-byte [0x80, ch, ch] header.
pub async fn read_message<F, Fut>(mut read_report: F) -> Result<Vec<u8>, String>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>, String>>,
{
    let first = read_report().await?;
    if first.len() < 5 {
        return Err("thp frame too short".into());
    }
    let length = u16::from_be_bytes([first[3], first[4]]) as usize; // bytes after the 5-byte header
    let total = 5 + length;
    let mut frame: Vec<u8> = first[..first.len().min(total)].to_vec();

    while frame.len() < total {
        let report = read_report().await?;
        if report.len() <= 3 {
            return Err("thp continuation report too short".into());
        }
        let need = total - frame.len();
        let body = &report[3..]; // drop [0x80, ch, ch]
        let take = need.min(body.len());
        frame.extend_from_slice(&body[..take]);
    }
    Ok(frame)
}

/// Outcome of a THP loop: the response frame hex (empty for send-only) + the (unchanged) state.
pub struct ThpResult {
    pub response_hex: String,
}

#[derive(Clone, Copy, PartialEq)]
enum LoopState {
    WriteRequest,
    ReadAck,
    ReadResponse,
    SendAck,
    SendRecentAck,
    Done,
}

/// The thpLoop state machine (transport-common/src/thp/loop.ts). `mode`:
/// - Call: write request, read response, send ack.
/// - Send (`/post`): write only, skip ack.
/// - Receive (`/read`): read response only, skip ack.
pub enum ThpMode {
    Call,
    Send,
    Receive,
}

const ATTEMPTS_LIMIT: u32 = 10;
const ACK_DEADLINE: std::time::Duration = std::time::Duration::from_secs(30);

pub async fn thp_loop<W, WFut, R, RFut>(
    chunks: Vec<[u8; CHUNK_SIZE]>,
    state: &mut ThpState,
    mut api_write: W,
    mut api_read: R,
    mode: ThpMode,
) -> Result<ThpResult, String>
where
    W: FnMut(Vec<u8>) -> WFut,
    WFut: std::future::Future<Output = Result<(), String>>,
    R: FnMut() -> RFut,
    RFut: std::future::Future<Output = Result<Vec<u8>, String>>,
{
    let skip_ack = matches!(mode, ThpMode::Send | ThpMode::Receive);
    let send_only = matches!(mode, ThpMode::Send);
    let receive_only = matches!(mode, ThpMode::Receive);

    let mut phase = if receive_only { LoopState::ReadResponse } else { LoopState::WriteRequest };
    let mut write_attempt = 0u32;
    let mut read_attempt = 0u32;
    let deadline = std::time::Instant::now() + ACK_DEADLINE;
    let mut captured: Option<Vec<u8>> = None;

    let channel = state.channel_bytes();

    // helper: read one full validated THP message (receiveExpectedMessage). Returns the frame or a
    // specific error string: UnexpectedChannel / UnexpectedCRC / UnexpectedRecentMessage /
    // UnexpectedMessage / UnexpectedRecvBit.
    async fn read_one<R, RFut>(
        api_read: &mut R,
        channel: &[u8],
        state: &ThpState,
    ) -> Result<Vec<u8>, String>
    where
        R: FnMut() -> RFut,
        RFut: std::future::Future<Output = Result<Vec<u8>, String>>,
    {
        let frame = read_message(|| api_read()).await?;
        let header = read_thp_header(&frame)?;
        if header.channel != channel {
            return Err("UnexpectedChannel".into());
        }
        // CRC over the whole frame minus the trailing 4 CRC bytes
        let payload = &frame[5..];
        if payload.len() >= 4 {
            let crc_expected = get_crc(payload);
            let crc_actual = crc32_be(&frame[..frame.len() - 4]);
            if crc_expected != crc_actual {
                return Err("UnexpectedCRC".into());
            }
        }
        // ERROR and ACK return immediately (no expected-response / recvBit check)
        if header.magic == ERROR || header.magic == ACK_MESSAGE {
            return Ok(frame);
        }
        // the message type must be one we expect; a CRC matching recentMessage means a retransmit
        let recent = hex::encode(get_crc(payload));
        if !state.expected_responses.contains(&header.magic) {
            if !recent.is_empty() && recent == state.recent_message {
                return Err("UnexpectedRecentMessage".into());
            }
            return Err("UnexpectedMessage".into());
        }
        // the device sequence bit must match what we expect to receive next
        if header.sequence_bit != state.recv_bit {
            if !recent.is_empty() && recent == state.recent_message {
                return Err("UnexpectedRecentMessage".into());
            }
            return Err("UnexpectedRecvBit".into());
        }
        Ok(frame)
    }

    while phase != LoopState::Done {
        match phase {
            LoopState::WriteRequest => {
                write_attempt += 1;
                if write_attempt > ATTEMPTS_LIMIT {
                    return Err("RetriesExceeded".into());
                }
                if std::time::Instant::now() >= deadline {
                    return Err("Aborted by deadline".into());
                }
                for chunk in &chunks {
                    api_write(chunk.to_vec()).await?;
                }
                if !send_only {
                    if let Some(first) = chunks.first() {
                        state.expected_responses = get_expected_responses(first);
                    }
                }
                let base = chunks.first().map(|c| clear_control_bit(c[0])).unwrap_or(0);
                phase = if !skip_ack && is_ack_expected(base) {
                    LoopState::ReadAck
                } else if send_only {
                    LoopState::Done
                } else {
                    LoopState::ReadResponse
                };
            }
            LoopState::ReadAck => {
                if std::time::Instant::now() >= deadline {
                    phase = LoopState::WriteRequest;
                    continue;
                }
                match read_one(&mut api_read, &channel, state).await {
                    Err(e) if e == "UnexpectedChannel" => { /* keep reading */ }
                    Err(e) if e == "UnexpectedCRC" => return Err(e),
                    Err(e) if e == "UnexpectedRecentMessage" => phase = LoopState::SendRecentAck,
                    Err(_) => phase = LoopState::WriteRequest,
                    Ok(frame) => {
                        let header = read_thp_header(&frame)?;
                        if header.magic == ACK_MESSAGE {
                            if header.ack_bit == state.send_ack_bit {
                                phase = LoopState::ReadResponse;
                            }
                        } else if header.magic == ERROR {
                            captured = Some(frame);
                            phase = LoopState::Done;
                        } else {
                            captured = Some(frame);
                            phase = LoopState::SendAck;
                        }
                    }
                }
            }
            LoopState::ReadResponse => {
                read_attempt += 1;
                if read_attempt > ATTEMPTS_LIMIT {
                    return Err("RetriesExceeded".into());
                }
                match read_one(&mut api_read, &channel, state).await {
                    Err(e) if e == "UnexpectedChannel" => { /* keep reading */ }
                    Err(e) if e == "UnexpectedCRC" => return Err(e),
                    Err(e) if e == "UnexpectedRecentMessage" && receive_only => {
                        phase = LoopState::SendRecentAck
                    }
                    Err(e) => return Err(e),
                    Ok(frame) => {
                        let header = read_thp_header(&frame)?;
                        if header.magic == ACK_MESSAGE {
                            // stray ack, keep reading
                        } else if header.magic == ERROR {
                            captured = Some(frame);
                            phase = LoopState::Done;
                        } else {
                            captured = Some(frame);
                            phase = LoopState::SendAck;
                        }
                    }
                }
            }
            LoopState::SendRecentAck => {
                api_write(encode_previous_ack(state)).await?;
                phase = if receive_only { LoopState::ReadResponse } else { LoopState::WriteRequest };
            }
            LoopState::SendAck => {
                let ack_expected = state
                    .expected_responses
                    .first()
                    .map(|c| is_ack_expected(clear_control_bit(*c)))
                    .unwrap_or(true);
                if !skip_ack && ack_expected && !state.piggyback_ack_enabled {
                    api_write(encode_ack(state)).await?;
                }
                if let Some(ref frame) = captured {
                    let payload = &frame[5.min(frame.len())..];
                    state.recent_message = hex::encode(get_crc(payload));
                }
                phase = LoopState::Done;
            }
            LoopState::Done => {}
        }
    }

    Ok(ThpResult {
        response_hex: captured.map(hex::encode).unwrap_or_default(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state(channel: &str) -> ThpState {
        ThpState {
            properties: serde_json::Value::Null,
            channel: channel.to_string(),
            send_bit: 0,
            recv_bit: 0,
            send_ack_bit: 0,
            recv_ack_bit: 0,
            send_nonce: 0,
            recv_nonce: 1,
            expected_responses: vec![],
            credentials: serde_json::Value::Null,
            recent_message: String::new(),
            piggyback_ack_enabled: false,
        }
    }

    #[test]
    fn encode_ack_matches_reference() {
        // spec reference: channel 1234, ackBit 0 → "20 1234 0004 d9fcce58"
        let ack = encode_ack(&state("1234"));
        assert_eq!(hex::encode(&ack), "201234 0004 d9fcce58".replace(' ', ""));
    }

    #[test]
    fn header_bits() {
        let h = read_thp_header(&[0x28, 0x12, 0x34]).unwrap(); // 0x20 | ack
        assert_eq!(h.magic, 0x20);
        assert_eq!(h.ack_bit, 1);
        assert_eq!(h.channel, vec![0x12, 0x34]);
    }

    #[test]
    fn expected_responses_encrypted() {
        assert_eq!(get_expected_responses(&[0x04]), vec![0x04]);
        assert_eq!(get_expected_responses(&[0x00]), vec![0x01]);
        // channel-allocation request expects the channel-allocation response (0x40 -> 0x41)
        assert_eq!(get_expected_responses(&[0x40]), vec![0x41]);
    }

    #[test]
    fn ack_expected_gate() {
        assert!(is_ack_expected(0x04));
        assert!(!is_ack_expected(0x40));
        assert!(!is_ack_expected(0x41));
    }

    #[test]
    fn thp_chunks_continuation_header() {
        let frame: Vec<u8> = std::iter::once(0x04u8)
            .chain([0x12u8, 0x34])
            .chain([0x00, 0x50]) // len 80
            .chain(std::iter::repeat(0xaa).take(80))
            .collect();
        let chunks = create_chunks(&frame);
        assert!(chunks.len() >= 2);
        assert_eq!(&chunks[1][..3], &[0x80, 0x12, 0x34]);
    }
}
