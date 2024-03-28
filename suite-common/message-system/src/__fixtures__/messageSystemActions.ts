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

It is signed by dev private key.
*/

export const validJws =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEsCiAgICAiYWN0aW9ucyI6IFtdCn0K.Qtemcj062ih5j2F7SaMw1Sgms8jhuo-312f9_2unPzLWKrewQNwaHxyZsZCk3M_6r4CKRcHsSzRTYNOF8k2W9A';

// jws with modified signature
export const unauthenticJws =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEsCiAgICAiYWN0aW9ucyI6IFtdCn0K.Yz_pZYLX10Er1S69wC3WmcKjBUpNE9RbqEhmI1j0SXvqscff3r1ooG2ibcSzyaorB5IAJYJ0qTN3zEH6BQlQuQ';

// jws with modified header and payload
export const corruptedJws =
    'eyJhbGciOiJFUzI1NiJ8.ewogICAgInZlcnNpb24iOiAx.OAmxykvcRZAmlbBcPwmBRulmOtzWG_WR82bgVIK8IKJlfx6Y_Tn2SrgpeNaaHABDeWiI8lg8N1BM2zdeVdW4KQ';

export const validJwsWithSequence10 =
    'eyJhbGciOiJFUzI1NiJ9.ewogICAgInZlcnNpb24iOiAxLAogICAgInRpbWVzdGFtcCI6ICIyMDIxLTAzLTAzVDAzOjQ4OjE2KzAwOjAwIiwKICAgICJzZXF1ZW5jZSI6IDEwLAogICAgImFjdGlvbnMiOiBbXQp9Cg.TMpucBIAepJqQb4P5Ad8pYzbStz5nQQfJb5jstrIBc37dpM3yklEOpLrK0xs8q77HN908H5wNEEfuL4lnmP4NQ';
