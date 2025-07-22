FROM ubuntu:22.04

ENV HOST=aarch64-linux
ENV OPENSSL_HOST=linux-aarch64

ENV DEBIAN_FRONTEND=noninteractive
ENV PREFIX=/tor
ENV PATH=$PREFIX/bin:$PATH

ENV include_dir=$PREFIX/include
ENV lib_dir=$PREFIX/lib

RUN apt update && apt install -y \
  build-essential \
  gcc-x86-64-linux-gnu g++-x86-64-linux-gnu \
  gcc-aarch64-linux-gnu g++-aarch64-linux-gnu \
  wget curl git ca-certificates \
  libtool autoconf automake pkg-config \
  make perl python3

WORKDIR /build
ENV MAKEFLAGS=-j$(nproc)

# ===== Custom flags ====
ENV __CPPFLAGS="-I${include_dir}"
ENV __LDFLAGS="-Wl,--no-as-needed -L${lib_dir} -lpthread -pthread"

ENV ZLIB_VERSION=1.3.1
ENV OPENSSL_VERSION=3.5.1
ENV LIBEVENT_VERSION=2.1.12
ENV TOR_VERSION=0.4.8.17

# ===== Build zlib =====
RUN wget https://zlib.net/zlib-$ZLIB_VERSION.tar.gz && \
    tar xzf zlib-$ZLIB_VERSION.tar.gz && cd zlib-$ZLIB_VERSION && \
	CPPFLAGS=$__CPPFLAGS LDFLAGS=$__LDFLAGS \
    CHOST=$HOST-gnu ./configure --prefix=$PREFIX --static && \
    make && make install

# ===== Build OpenSSL =====
WORKDIR /build
RUN wget https://www.openssl.org/source/openssl-$OPENSSL_VERSION.tar.gz && \
    tar xzf openssl-$OPENSSL_VERSION.tar.gz && cd openssl-$OPENSSL_VERSION && \
	CPPFLAGS=$__CPPFLAGS LDFLAGS=$__LDFLAGS \
    ./Configure $OPENSSL_HOST --prefix=$PREFIX --cross-compile-prefix=$HOST-gnu- \
	threads no-shared no-tests no-dso no-comp && \
    make && make install_sw

# ===== Build libevent =====
WORKDIR /build
RUN wget https://github.com/libevent/libevent/releases/download/release-$LIBEVENT_VERSION-stable/libevent-$LIBEVENT_VERSION-stable.tar.gz && \
    tar xzf libevent-$LIBEVENT_VERSION-stable.tar.gz && cd libevent-$LIBEVENT_VERSION-stable && \
	CPPFLAGS=$__CPPFLAGS LDFLAGS=$__LDFLAGS \
    ./configure --host=$HOST-gnu --prefix=$PREFIX --disable-shared --enable-static --with-pic \
	CC=$HOST-gnu-gcc CXX=$HOST-gnu-g++ && \
    make && make install

# ===== Build Tor =====
WORKDIR /build
RUN wget https://www.torproject.org/dist/tor-$TOR_VERSION.tar.gz && \
    tar xzf tor-$TOR_VERSION.tar.gz && cd tor-$TOR_VERSION && \
    ./configure \
      --host=$HOST-gnu \
      --prefix=$PREFIX \
      CC=$HOST-gnu-gcc \
      CXX=$HOST-gnu-g++ \
      --disable-asciidoc \
      --with-libevent-dir=$PREFIX \
      --with-openssl-dir=$PREFIX \
      --with-zlib-dir=$PREFIX \
	  --enable-static-tor --enable-static-libevent --enable-static-openssl --enable-static-zlib \
      PKG_CONFIG=false && \
    make && make install


