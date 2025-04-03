use pretty_env_logger;
use structopt::StructOpt;

mod server;

#[derive(StructOpt, Debug)]
#[structopt(name = "trezor-bluetooth")]
struct Opts {
    #[structopt(short, long, default_value = "21327")]
    port: u16,
}

#[tokio::main]
async fn main() {
    pretty_env_logger::init();

    let opt = Opts::from_args();
    let addr = format!("127.0.0.1:{}", opt.port);

    match server::start_server(&addr).await {
        // Ok should not happen as start_server runs indefinitely unless there's an error
        Ok(_) => Err("Server unexpectedly stopped".to_string()),
        Err(err) => Err(format!("Server start error {:?}", err)),
    }
    .expect("Server unexpectedly stopped")
}
