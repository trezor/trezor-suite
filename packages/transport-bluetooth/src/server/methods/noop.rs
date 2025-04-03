use crate::server::types::MethodResult;

pub async fn noop() -> MethodResult {
    Err("NOOP".into())
}
