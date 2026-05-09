// OLT local-dev CryptPad SSO config.
//
// This file reads credentials from the container environment so tracked files
// never contain real client secrets.

module.exports = {
  enabled: true,
  enforced: false,
  cpPassword: false,
  forceCpPassword: false,
  list: [
    {
      name: 'Open Learning Tools',
      type: 'oidc',
      url: process.env.CRYPTPAD_OIDC_ISSUER || 'http://olt.localhost',
      client_id: process.env.CRYPTPAD_OAUTH_CLIENT_ID,
      client_secret: process.env.CRYPTPAD_OAUTH_CLIENT_SECRET,
      jwt_alg: 'RS256',
      username_scope: 'profile email',
      username_claim: 'email',
      use_pkce: true,
      use_nonce: false,
    },
  ],
};
