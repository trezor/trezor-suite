//! Trezor wire-protocol framing — the Rust port of `@trezor/protocol` v1 / bridge, plus the
//! USB/UDP 64-byte report chunking from `@trezor/transport-common`.
//!
//! Two formats are involved:
//! - **bridge**: the format the frontend's `BridgeTransport` puts in `/call` `/post` bodies:
//!   `<msgType:2 BE><len:4 BE><payload>` (6-byte header, no magic).
//! - **v1**: the USB wire message: `?##<msgType:2 BE><len:4 BE><payload>` = `3f 23 23 …`, then
//!   split into 64-byte reports each prefixed with the `0x3f` report byte.
//!
//! The bridge server converts bridge↔v1 and does the chunking, exactly like trezord.

pub const CHUNK_SIZE: usize = 64;
const REPORT_BYTE: u8 = 0x3f; // '?'
const MAGIC_BYTE: u8 = 0x23; // '#'
const V1_HEADER_SIZE: usize = 9; // 3f 23 23 + type(2) + len(4)
const BRIDGE_HEADER_SIZE: usize = 6; // type(2) + len(4)

#[derive(Debug, Clone)]
pub struct Message {
    pub message_type: u16,
    pub payload: Vec<u8>,
}

/// Decode a `bridge`-format body (`<type:2><len:4><payload>`).
pub fn bridge_decode(bytes: &[u8]) -> Result<Message, String> {
    if bytes.len() < BRIDGE_HEADER_SIZE {
        return Err("bridge message too short".into());
    }
    let message_type = u16::from_be_bytes([bytes[0], bytes[1]]);
    let length = u32::from_be_bytes([bytes[2], bytes[3], bytes[4], bytes[5]]) as usize;
    let payload = &bytes[BRIDGE_HEADER_SIZE..];
    // trezord tolerates a payload shorter/longer than the declared length; take min
    let end = length.min(payload.len());
    Ok(Message {
        message_type,
        payload: payload[..end].to_vec(),
    })
}

/// Encode to `bridge` format (`<type:2><len:4><payload>`).
pub fn bridge_encode(msg: &Message) -> Vec<u8> {
    let mut out = Vec::with_capacity(BRIDGE_HEADER_SIZE + msg.payload.len());
    out.extend_from_slice(&msg.message_type.to_be_bytes());
    out.extend_from_slice(&(msg.payload.len() as u32).to_be_bytes());
    out.extend_from_slice(&msg.payload);
    out
}

/// Encode to the full v1 USB message (`3f 23 23 <type:2> <len:4> <payload>`).
pub fn v1_encode(msg: &Message) -> Vec<u8> {
    let mut out = Vec::with_capacity(V1_HEADER_SIZE + msg.payload.len());
    out.push(REPORT_BYTE);
    out.push(MAGIC_BYTE);
    out.push(MAGIC_BYTE);
    out.extend_from_slice(&msg.message_type.to_be_bytes());
    out.extend_from_slice(&(msg.payload.len() as u32).to_be_bytes());
    out.extend_from_slice(&msg.payload);
    out
}

/// Split a v1-encoded message into 64-byte USB reports (mirrors `createChunks`): the first report
/// is the message's first 64 bytes; each continuation report is `0x3f` + the next 63 bytes; all
/// zero-padded to 64.
pub fn create_chunks(encoded: &[u8]) -> Vec<[u8; CHUNK_SIZE]> {
    if encoded.len() <= CHUNK_SIZE {
        let mut chunk = [0u8; CHUNK_SIZE];
        chunk[..encoded.len()].copy_from_slice(encoded);
        return vec![chunk];
    }
    let mut chunks = Vec::new();
    let mut first = [0u8; CHUNK_SIZE];
    first.copy_from_slice(&encoded[..CHUNK_SIZE]);
    chunks.push(first);

    let mut pos = CHUNK_SIZE;
    while pos < encoded.len() {
        let end = (pos + CHUNK_SIZE - 1).min(encoded.len());
        let mut chunk = [0u8; CHUNK_SIZE];
        chunk[0] = REPORT_BYTE;
        chunk[1..1 + (end - pos)].copy_from_slice(&encoded[pos..end]);
        chunks.push(chunk);
        pos = end;
    }
    chunks
}

/// Reassemble a v1 message from a stream of 64-byte reports fetched via `read_report`.
/// Mirrors `receive()`: the first report carries the `3f2323 type len` header + payload start; each
/// continuation report contributes its bytes after the leading `0x3f` report byte.
pub async fn read_v1_message<F, Fut>(mut read_report: F) -> Result<Message, String>
where
    F: FnMut() -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>, String>>,
{
    let first = read_report().await?;
    if first.len() < V1_HEADER_SIZE {
        return Err("v1 header too short".into());
    }
    if first[0] != REPORT_BYTE || first[1] != MAGIC_BYTE || first[2] != MAGIC_BYTE {
        return Err("v1 protocol malformed (magic)".into());
    }
    let message_type = u16::from_be_bytes([first[3], first[4]]);
    let length = u32::from_be_bytes([first[5], first[6], first[7], first[8]]) as usize;

    let mut payload = Vec::with_capacity(length);
    payload.extend_from_slice(&first[V1_HEADER_SIZE..]);
    payload.truncate(length); // first report may already contain the whole (short) payload

    while payload.len() < length {
        let report = read_report().await?;
        if report.is_empty() {
            return Err("v1 read: empty report".into());
        }
        // continuation reports are prefixed with the 0x3f report byte
        let body = if report[0] == REPORT_BYTE { &report[1..] } else { &report[..] };
        let need = length - payload.len();
        let take = need.min(body.len());
        payload.extend_from_slice(&body[..take]);
    }

    Ok(Message {
        message_type,
        payload,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bridge_roundtrip() {
        let msg = Message { message_type: 0x0011, payload: vec![1, 2, 3, 4] };
        let enc = bridge_encode(&msg);
        assert_eq!(&enc[..6], &[0x00, 0x11, 0x00, 0x00, 0x00, 0x04]);
        let dec = bridge_decode(&enc).unwrap();
        assert_eq!(dec.message_type, 0x0011);
        assert_eq!(dec.payload, vec![1, 2, 3, 4]);
    }

    #[test]
    fn v1_encode_header() {
        let msg = Message { message_type: 0x0011, payload: vec![0xaa; 3] };
        let enc = v1_encode(&msg);
        assert_eq!(&enc[..9], &[0x3f, 0x23, 0x23, 0x00, 0x11, 0x00, 0x00, 0x00, 0x03]);
        assert_eq!(&enc[9..], &[0xaa, 0xaa, 0xaa]);
    }

    #[test]
    fn chunks_small_message_single_padded() {
        let enc = v1_encode(&Message { message_type: 1, payload: vec![0xff; 5] });
        let chunks = create_chunks(&enc);
        assert_eq!(chunks.len(), 1);
        assert_eq!(chunks[0].len(), 64);
        assert_eq!(chunks[0][0], 0x3f);
    }

    #[test]
    fn chunks_large_message_multi() {
        // payload 200 bytes → 9 + 200 = 209 encoded → chunk0(64) + ceil(145/63)=3 more = 4 chunks
        let enc = v1_encode(&Message { message_type: 1, payload: vec![7u8; 200] });
        let chunks = create_chunks(&enc);
        assert!(chunks.len() >= 2);
        // continuation chunks start with the report byte
        assert_eq!(chunks[1][0], 0x3f);
        // total capacity covers the whole encoded message
        assert!(chunks.len() * 64 >= enc.len());
    }

    #[tokio::test]
    async fn read_reassembles_multi_report() {
        // build a 130-byte payload message, chunk it, then read it back
        let msg = Message { message_type: 0x0022, payload: (0..130).map(|i| i as u8).collect() };
        let enc = v1_encode(&msg);
        let chunks = create_chunks(&enc);
        let reports: Vec<Vec<u8>> = chunks.iter().map(|c| c.to_vec()).collect();
        let idx = std::cell::Cell::new(0usize);
        let out = read_v1_message(|| {
            let i = idx.get();
            idx.set(i + 1);
            let r = reports[i].clone();
            async move { Ok(r) }
        })
        .await
        .unwrap();
        assert_eq!(out.message_type, 0x0022);
        assert_eq!(out.payload, msg.payload);
    }
}
