use pretty_env_logger;
use structopt::StructOpt;

mod server;

// command line arguments to modify the server,
// for example to change the port of the server
#[derive(StructOpt, Debug)]
#[structopt(name = "trezor-ble")]
struct Opts {
    // Optional port to run on.
    #[structopt(short, long, default_value = "21327")]
    port: u16,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    pretty_env_logger::init();

    let opt = Opts::from_args();
    let addr = vec!["127.0.0.1:".to_string(), opt.port.to_string()].join("");

    if let Err(err) = server::start(&addr).await {
        eprintln!("Websocket server start error: {err:?}");
    }

    Ok(())
}
