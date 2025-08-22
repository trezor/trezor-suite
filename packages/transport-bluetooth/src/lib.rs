use napi_derive::napi;

mod server;

#[napi]
fn trezor_bluetooth_run(port: u16) {
    pretty_env_logger::try_init();

    let addr = format!("127.0.0.1:{}", port);

    std::thread::spawn(move || {
        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(async move {
                server::start_server(&addr).await.unwrap_or_else(|err| {
                    log::error!("Error starting server: {}", err);
                });
            });
    });
}
