openssl req -x509 -out scripts/localhost.crt -keyout scripts/localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost'