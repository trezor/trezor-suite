{ stdenv
, alsaLib
, xorg
, at-spi2-atk
, at-spi2-core
, atk
, cairo
, cups
, dbus
, expat
, gdk_pixbuf
, gtk3-x11
, gtk3
, glib
, glibc
, gnome2
, libuuid
, libogg
, libpulseaudio
, nss
, nspr
, systemd
, patchelf
, vivaldi-ffmpeg-codecs
}:

stdenv.mkDerivation rec {
  pname = "trezor-suite";
  version = "unstable-head";

  src = ./packages/suite-desktop/build-electron/linux-unpacked;

  phases = [ "installPhase" "fixupPhase" ];

  installPhase = ''
    mkdir -p $out/bin
    cp -r $src/* $out/bin
    chmod +w $out/bin/TrezorSuite
   '';

  fixupPhase = let
   libPath = stdenv.lib.makeLibraryPath [
    alsaLib
    at-spi2-atk
    at-spi2-core
    atk
    cairo
    cups
    dbus
    expat
    gdk_pixbuf
    gtk3-x11
    gtk3
    glib
    gnome2.pango
    libuuid
    libogg
    libpulseaudio
    nss
    nspr
    systemd
    vivaldi-ffmpeg-codecs
    xorg.libXtst
    xorg.libXScrnSaver
    xorg.libX11
    xorg.libXcomposite
    xorg.libXrender
    xorg.libxcb
    xorg.libXcursor
    xorg.libXdamage
    xorg.libXfixes
    xorg.libXi
    xorg.libXext
    xorg.libXrandr
   ];
  in ''
    patchelf \
      --set-interpreter "$(cat $NIX_CC/nix-support/dynamic-linker)" \
      --set-rpath "${libPath}" \
      $out/bin/TrezorSuite
  '';
}

