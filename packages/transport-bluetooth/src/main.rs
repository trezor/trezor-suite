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
        Ok(_) => {
            eprintln!("Server unexpectedly stopped");
            std::process::exit(1);
        }
        Err(err) => {
            eprintln!("Server start error: {:?}", err);
            std::process::exit(1);
        }
    }
}
