use crate::server::{
    device::DeviceConnectionStatus, platform::ConnectDeviceContext, types::NotificationEvent,
};
use dbus::{
    blocking::{Connection, Proxy},
    channel::MatchingReceiver,
};
use dbus_crossroads::{Crossroads, IfaceBuilder};
use log::info;
use std::sync::{mpsc, Arc};
use tokio::sync::oneshot;
use tokio::time::Duration;

const AGENT_MANAGER: &str = "org.bluez.AgentManager1";
const AGENT_INTERFACE: &str = "org.bluez.Agent1";
const AGENT_PATH: &str = "/org/bluez/Agent";

#[derive(Debug, thiserror::Error)]
enum AgentError {
    #[error("DBus error: {0}")]
    DBus(#[from] dbus::Error),
}

fn unregister_agent(proxy: &Proxy<'_, &Connection>) {
    let agent_path = dbus::Path::from(AGENT_PATH);
    let res: Result<(), dbus::Error> =
        proxy.method_call(AGENT_MANAGER, "UnregisterAgent", (agent_path,));
    if res.is_ok() {
        info!("Agent unregistered");
    }
}

fn register_agent(proxy: &Proxy<'_, &Connection>) -> Result<(), dbus::Error> {
    let agent_path = dbus::Path::from(AGENT_PATH);
    proxy.method_call::<(), _, _, _>(
        AGENT_MANAGER,
        "RegisterAgent",
        (agent_path.clone(), "DisplayYesNo"),
    )?;

    proxy.method_call::<(), _, _, _>(AGENT_MANAGER, "RequestDefaultAgent", (agent_path,))?;

    info!("Agent registered");

    Ok(())
}

fn run_agent(
    ctx: ConnectDeviceContext,
    tokio_handle: tokio::runtime::Handle,
    ready: oneshot::Sender<()>,
    abort: mpsc::Receiver<()>,
) -> Result<(), AgentError> {
    let conn = Connection::new_system()?;
    let timeout = Duration::from_millis(ctx.params.timeout.into());
    let proxy = conn.with_proxy("org.bluez", "/org/bluez", timeout);

    unregister_agent(&proxy);
    register_agent(&proxy)?;

    let manager = Arc::new(ctx.manager);
    let device_id = Arc::new(ctx.params.id);

    let mut cr = Crossroads::new();
    let agent_iface = cr.register(AGENT_INTERFACE, |b: &mut IfaceBuilder<()>| {
        let manager = manager.clone();
        let device_id = device_id.clone();
        let handle = tokio_handle.clone();

        b.method(
            "RequestConfirmation",
            ("device", "passkey"),
            (),
            move |_, _, (_, passkey): (dbus::Path, u32)| {
                let (tx, rx) = mpsc::channel();
                let manager = manager.clone();
                let device_id = device_id.to_string();
                let pin = format!("{:06}", passkey);

                handle.spawn({
                    info!("Agent PIN {:?}", pin);

                    async move {
                        let accepted = match manager.get_device_or_die(device_id).await {
                            Ok(device) => {
                                let phase = DeviceConnectionStatus::Pairing { pin: Some(pin) };
                                device.set_connection_status(phase);
                                manager
                                    .dispatch_notification(
                                        NotificationEvent::DeviceConnectionStatus { device },
                                    )
                                    .await;
                                true
                            }
                            Err(_) => false,
                        };

                        let _ = tx.send(accepted);
                    }
                });

                match rx.recv_timeout(timeout) {
                    Ok(true) => Ok(()),
                    Ok(false) => Err(dbus::MethodErr::failed("Rejected")),
                    Err(_) => Err(dbus::MethodErr::failed("Timeout")),
                }
            },
        );
    });

    let agent_path = dbus::Path::from(AGENT_PATH);
    cr.insert(agent_path, &[agent_iface], ());

    conn.start_receive(
        dbus::message::MatchRule::new_method_call(),
        Box::new(move |msg, conn| {
            let _ = cr.handle_message(msg, conn);
            true
        }),
    );

    let _ = ready.send(());

    loop {
        conn.process(Duration::from_millis(200))?;
        if matches!(abort.try_recv(), Ok(())) {
            break;
        }
    }

    info!("Shutting down agent");
    unregister_agent(&proxy);

    Ok(())
}

// wrap `run_agent` blocking code with a new thread and pass current runtime reference to async handler in "RequestConfirmation"
// ready - resolved once Agent is successfully registered otherwise returns error
// abort - shutdown thread
pub fn create_agent(ctx: ConnectDeviceContext) -> (oneshot::Receiver<()>, mpsc::Sender<()>) {
    let tokio_handle = tokio::runtime::Handle::current();
    let (ready_tx, ready_rx) = oneshot::channel::<()>();
    let (abort_tx, abort_rx) = mpsc::channel::<()>();

    std::thread::spawn(move || {
        if let Err(e) = run_agent(ctx, tokio_handle, ready_tx, abort_rx) {
            info!("Agent listener failed: {:?}", e);
        }
    });

    (ready_rx, abort_tx)
}
