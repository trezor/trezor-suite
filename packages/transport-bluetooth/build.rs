#[cfg(feature = "napi")]
fn main() {
    napi_build::setup();
}

#[cfg(not(feature = "napi"))]
fn main() {}
