export const messageId1 = '22e6444d-a586-4593-bc8d-5d013f193eba';
export const messageId2 = '469c65a8-8632-11eb-8dcd-0242ac130003';
export const messageId3 = '506b1322-8632-11eb-8dcd-0242ac130003';

/*
JWS below is signed config with only mandatory fields:
{
    "version": 1,
    "timestamp": "2021-03-03T03:33:33+00:00",
    "sequence": 1,
    "actions": []
}

It is signed by dev private key. Its corresponding public key is provided below.
*/

export const DEV_JWS_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEbSUHJlr17+NywPS/w+xMkp3dSD8eWXSuAfFKwonZPe5fL63kISipJC+eJP7Mad0WxgyJoiMsZCV6BZPK2jIFdg==
-----END PUBLIC KEY-----`;

export const validJws =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEsCiAgICAiYWN0aW9ucyI6IFtdCn0K.TMzhvkIBdvI5xvoT6MF1kqozXet9LaYgloZ5eMEl_3x_Kb_Af7hgyY0Z1wGrGfpGZ7bU-QO_4pqvfiiTX-sUOg';

// jws with modified signature
export const unauthenticJws =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEsCiAgICAiYWN0aW9ucyI6IFtdCn0K.ToMhvkIBdvI5xvoT6MF1kqozXet9LaYgloZ5eMEl_3x_Kb_Af7hgyY0Z1wGrGfpGZ7bU-QO_4pqvfiiTX-sUOg';

// jws with modified header and payload
export const corruptedJws =
    'eyJhbGciOiJFUzI1NiJ8.ewogICAgInZlcnNpb24iOiAxLAogICAgIn.TMzhvkIBdvI5xvoT6MF1kqozXet9LaYgloZ5eMEl_3x_Kb_Af7hgyY0Z1wGrGfpGZ7bU-QO_4pqvfiiTX-sUOg';

export const validJwsWithSequence10 =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEwLAogICAgImFjdGlvbnMiOiBbXQp9Cg.6C-QY6DD_sFDZBUL4I4EoWGlenv-w_M1sHQ9IM82uip9xqh186jbO08YcAQ-fasYgw7lm0UmwJf9uToo_WOAJA';
