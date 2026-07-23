//! Shared child-process hardening for the spawned binaries (tor daemon, trezor-bluetooth server).
//!
//! The Trezor Bridge and the BLE management host are now in-process Rust (no Node sidecars), so the
//! only children the shell spawns are the bundled tor daemon and the native `trezor-bluetooth` BLE
//! server binary.
//!
//! - On Linux, ask the kernel to send SIGTERM to the child when the parent (the Suite shell) dies,
//!   so a SIGKILL / crash of the app doesn't leave an orphaned tor daemon holding its DataDirectory
//!   lock or a trezor-bluetooth server holding :21327. `RunEvent::Exit` handles the graceful path;
//!   PR_SET_PDEATHSIG covers the abnormal one.
//! - Detach stdio to null so a chatty long-lived child can never block on a full inherited pipe
//!   when the app is launched detached (matches Electron BaseProcess stdio: 'ignore').

use std::process::Command;

/// Harden a spawned child: parent-death signal (Linux) + null stdio.
/// Used for the trezor-bluetooth server; tor uses `harden_keep_stdout` (it needs its stdout).
pub fn harden(cmd: &mut Command) -> &mut Command {
    parent_death_signal(cmd);
    cmd.stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .stdin(std::process::Stdio::null())
}

/// Harden but keep stdout piped (tor needs it to parse bootstrap progress).
pub fn harden_keep_stdout(cmd: &mut Command) -> &mut Command {
    parent_death_signal(cmd);
    cmd
}

#[cfg(target_os = "linux")]
fn parent_death_signal(cmd: &mut Command) {
    use std::os::unix::process::CommandExt;
    // SAFETY: prctl is async-signal-safe and we touch no other process state in the child.
    unsafe {
        cmd.pre_exec(|| {
            // libc::PR_SET_PDEATHSIG = 1, SIGTERM = 15
            let ret = libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGTERM as libc::c_ulong, 0, 0, 0);
            if ret != 0 {
                return Err(std::io::Error::last_os_error());
            }
            // Close the classic PDEATHSIG race: if the parent already died between fork() and this
            // prctl(), the signal will never fire. Detect reparenting to init (ppid == 1) and refuse
            // to exec so we don't leave an orphan sidecar holding a port.
            if libc::getppid() == 1 {
                return Err(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "parent exited before child armed PDEATHSIG",
                ));
            }
            Ok(())
        });
    }
}

#[cfg(not(target_os = "linux"))]
fn parent_death_signal(_cmd: &mut Command) {
    // macOS/Windows have no direct PDEATHSIG equivalent; the RunEvent::Exit handler covers the
    // graceful path, and each sidecar also self-terminates its own grandchild.
}

