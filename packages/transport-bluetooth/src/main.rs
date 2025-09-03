mod server;

#[tokio::main]
async fn main() {
    pretty_env_logger::init();
    let port = match std::env::var("TREZOR_BLUETOOTH_PORT") {
        Ok(port) => port,
        Err(_) => "21327".to_string(),
    };

    let addr = format!("127.0.0.1:{}", port);

    match server::start_server(&addr).await {
        // Ok should not happen as start_server runs indefinitely unless there's an error
        Ok(_) => Err("Server unexpectedly stopped".to_string()),
        Err(err) => Err(format!("Server start error {:?}", err)),
    }
    .expect("Server unexpectedly stopped")
}
