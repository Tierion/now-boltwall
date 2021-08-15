# The Boltwall Deployment Toolkit

`now-boltwall` is a command line tool that makes it easy to configure and deploy
a lightning-enabled paywall server using [boltwall](https://github.com/Tierion/boltwall) with
no coding experience and in just a couple minutes.

Using `now-boltwall` you can deploy a live, TLS-secured server that allows you to get
paid to your lightning node, _for free_.

**SUPPORTS**

- Easy configuration to connect with BTCPay Server
- Time and origin-based access restrictions
- Add a paywall to existing endpoints
- OpenNode configuration for a paywall with custodial lightning node
- Easy re-deployment with by automatically saving env secrets to the `vercel` environment
- Automatically generate `.env` files to save configuration
- HODL invoices for escrow-like support and split payments
- Account-less authorization using LSATs

To learn more about Boltwall, checkout the module's [documentation](https://github.com/tierion/boltwall)
for detailed information on its API, using it in a standalone server, about how it uses macaroons
and LSATs for authorization, and much more.

**TABLE OF CONTENTS**

- [The Boltwall Deployment Toolkit](#the-boltwall-deployment-toolkit)
  - [System Requirements](#system-requirements)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Secrets](#secrets)
    - [Deploy](#deploy)
  - [Configurations](#configurations)
    - [Connection Credentials](#connection-credentials)
    - [Boltwall Configs](#boltwall-configs)
    - [Server Configs](#server-configs)
    - [BTCPay Server Configuration](#btcpay-server-configuration)
  - [API](#api)
      - [`GET /api/node`](#get-apinode)
      - [`[METHOD] /api/[BOLTWALL_PATH]`](#method-apiboltwall_path)
      - [`POST /api/invoice`](#post-apiinvoice)
      - [`GET /api/invoice`](#get-apiinvoice)
  - [Additional Information](#additional-information)
  - [Troubleshooting](#troubleshooting)

## System Requirements

- `vercel` cli (formerly `now` by Zeit) and an account with vercel's serverless deployment service
- `node >0.10.0`

## Installation

This assumes you already have your own lightning node running [lnd](https://lightning.engineering) on its own, with [BTCPay Server](https://btcpayserver.org/) or with [OpenNode](https://www.opennode.com/)

If you've never used `vercel` before, create a [vercel account](https://vercel.com)
for free, serverless deployments.

Next, install `vercel`:

```shell
# npm i -g vercel // to install with npm
$ yarn global add vercel
```

Then do the same for `now-boltwall`:

```shell
# npm i -g now-boltwall // to install with npm
$ yarn global add now-boltwall
```

That's it! You're ready to go.

## Usage

Run the command `now-boltwall --help` or `now-boltwall` with no other commands
to get usage instructions:

```shell
$ now-boltwall --help
Usage:  [options] [command]

Vercel lambda deployment for a Nodejs Lightning-powered Paywall

Options:
  -V, --version              output the version number
  -h, --help                 output usage information

Commands:
  secrets|s                  Set environment variable secrets for LND connections
  deploy|d [options] [name]  Deploy an instance using now-cli. Pass custom name if not using directory name.

```

### Secrets

```shell
$ now-boltwall secrets
```

Generates and saves configurations for connecting boltwall to a lightning node.
Simply run `now-boltwall secrets` and the CLI will walk you through the steps to generate
(in the case of BTCPay Server) and save the credentials.

The CLI offers two ways to persist the secrets:

- using `vercel` secrets (see [documentation](https://zeit.co/docs/v2/serverless-functions/env-and-secrets/?query=secrets) for more information)
- In an `.env` file

`vercel` secrets are _required_ for deploying to a live server. The `.env` option can be helpful for saving references
to secrets or running a local server with `vercel dev`.

**NOTE**: When generating new secrets or an `.env` file, any existing values will be overwritten.
This is to avoid any conflicting configurations and because `vercel secrets` only supports saving
one secret of a given name at a time.

**NOTE 2:** A `vercel secret` remains hidden forever. While it can be passed to a deployment, there is no way
for a developer to read a previously set secret.

### Deploy

```shell
$ now-boltwall deploy --help
Usage: now-boltwall deploy|d [options] [name]

Deploy an instance using vercel. Pass custom name if not using directory name.

Options:
  -s --secrets        Use vercel secrets for configs
  -e --env [envPath]  Use env vars and .env file (at envPath if set, defaults to current working dir) for configs
  -h, --help          output usage information

```

`now-boltwall deploy` will deploy a live boltwall instance to vercel's server, giving you
a URL where you can access it.

Both secrets and a `.env` file are supported for passing configurations to the deployment. If
both are enabled (e.g. with `now-boltwall deploy -es`) then secrets will take precedence.

In addition to the credentials Boltwall needs to connect to your lightning node, there are
other parameters you can pass to customize your boltwall deployment. Any options that are not
present in a `.env` file or `vercel secrets` will be asked about by the CLI before deployment.
Learn more about all available [configurations](#configurations) further below.

The `name` parameter will determine the name of the project used for deployment and will be used
in the final URL. If none is passed, `name` defaults to the name of the project directory (e.g. `now-boltwall`).

## Configurations

The following configurations are available to be set for deployment. Save them in your `.env`
file to persist across deployments (and between `dev` and `prod`). They can also be
set via `vercel secrets` by setting the _lowercase_ variable name equivalent,
but cannot be read afterward.

Remember that if you save `now-boltwall secrets` in a `.env` file at the same location,
the older one will be ovewritten.

If not set in either location, the CLI will ask you your preferences before deployment (but
the values will not be preserved for future deployments).

### Connection Credentials

Learn how to retrieve these values from your own node with this
[tool](https://lightningjoule.com/tools/node-info). `now-boltwall secrets` will generate
these automatically for you if connecting to a [BTCPay Server](#btcpay-server-configuration).

- `LND_SOCKET`- e.g. _[host]:[port]_ where the lightning code can be reached
- `LND_TLS_CERT` - hex or base64 encoded string representing the TLS_CERT for nodes where this is enabled
- `LND_MACAROON`- hex or base64 encoded string of the admin macaroon required for authenticating lnd requests

### Boltwall Configs

- `TIME_CAVEAT`- Restricts access to endpoint by time: 1 second for every satoshi paid
- `ORIGIN_CAVEAT`- Restricts access to only requests made from the IP that the original
  request was made from
- `MIN_AMOUNT`- Minimum amount any invoice can be generated for
- `BOLTWALL_HODL`- Whether or not to enable HODL invoices. This is an advanced API, so if you
  are unsure what it does or why you would need, keep this disabled. Read more about hodl invoices
  in Boltwall [here](https://github.com/Tierion/boltwall#hodl-invoices).

### Server Configs

- `BOLTWALL_PATH`- Path where the protected content can be accessed (and will return a `402` with
  LSAT challenge when unauthenticated). Prefixed with `/api` and defaults to `protected`, so the
  default path will be `/api/protected`
- `BOLTWALL_PROTECTED_URL`- This is the endpoint that is protected by boltwall and accessed
  via `/api/[BOLTWALL_PATH]`. The server will proxy authenticated requests to this URL and can
  be any URL you want. Try it out with the PokéAPI as a test (https://pokeapi.co/api/v2/) and then
  make a paid request to `/api/protected/pokemon/pikachu`
- `BOLTWALL_ORIGIN`- For CORS policy. If nothing is set, now-boltwall will default to setting
  `origin:true` which allows requests from all origins. To restrict to a specific host, set this
  via the CLI or `.env` file.

### BTCPay Server Configuration

**IMPORTANT:** Boltwall only currently supports grpc connections with LND, so you will need
to make sure your BTCPay Server is configured correctly.

To get the configuration for your node, all `now-boltwall` needs is a config url. This can be
retrieved by following these simple steps:

1. Login to your BTCPay server
2. Click "Server Settings" from the top menu
3. Click on "Services" from the side menu
4. Click "See information" on the row that says "_BTC LND (gRPC server)_"
5. Click button "Show QR Code"
6. Under the generated QR code, there will be a link to see the code's information. Click that link (should be linked on the word "here")
7. This a URL that only remains valid for ~10 minutes so as not to leak sensitive information.
   **DO NOT SHARE THIS WITH ANYONE**. Access to this information allows for full access to your
   lightning node.
8. Copy this url and paste (or re-type) it when asked in `now-boltwall secrets`.

## API

This is the normal [Boltwall API](https://app.swaggerhub.com/apis-docs/boltwall/boltwall/2.0.0-beta-oas3)
that is exposed with a deployed now-boltwall instance.

Read the full [boltwall documentation](https://github.com/Tierion/boltwall) for additional details.

#### `GET /api/node`

Retrieve information about your node including alias, public key, access uris and channel information.

#### `[METHOD] /api/[BOLTWALL_PATH]`

Access protected content. If no valid LSAT is provided in `Authorized` header than a
`402: Payment Required` response will be sent instead.

#### `POST /api/invoice`

Sent with `{ amount: 30 }` will generate a new invoice for 30 satoshis.

#### `GET /api/invoice`

Sent with a valid LSAT in the header will retrieve the information for the given invoice
indicated by the paymentHash encoded in the LSAT.

## Additional Information

- Learn more about the API in the [swagger docs](https://app.swaggerhub.com/apis-docs/boltwall/boltwall/2.0.0-beta-oas3)

- Read about how `boltwall` works and how you can use it directly as a middleware in your own
  `expressjs` application [here](https://github.com/Tierion/boltwall)

- Use LSATs in your own application with the [`lsat-js`](https://github.com/Tierion/lsat-js) library
- Create, consume, parse, and manipulate raw LSATs with the
  [LSAT Playground](https://lsat-playground.bucko.now.sh/).

## Troubleshooting

- If you get an error from Zeit, you'll want to log in to your [Vercel dashboard](https://vercel.com) and
  check the logs for your deployment.
- If an LSAT that should be valid is getting `Unauthorized` responses, make sure that the
  `SESSION_SECRET` is getting persisted. Macaroons are signed and verified with this value.
  If it changes between restarts, old LSATs will not return the same signature.
