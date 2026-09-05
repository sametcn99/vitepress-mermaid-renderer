# auth.md

This site publishes public documentation and package information. It does not
currently expose a protected API or require an agent to create an account.

## Agent audience

Agents may read the documentation and public discovery metadata without a
credential. Use the links below to discover the available resources:

- OAuth protected-resource metadata: `/.well-known/oauth-protected-resource`
- Authorization-server metadata: `/.well-known/oauth-authorization-server`
- Agent capability catalog: `/.well-known/ai-catalog.json`

## Registration and credentials

No registration or provisioning endpoint is required for the public resources on
this site. The supported identity type is `anonymous`, and the supported
credential type is `none`. If a protected API is introduced later, this file and
the OAuth metadata will be updated with its registration, token, claim, and
revocation procedures before credentials are requested.
