# The `now` Boltwall Builder

An easy to deploy gateway for enabling payments and authentication with other compatible applications.
The package simply exposes a simple expressjs server with the last middleware being a `boltwall` paywall.
Any middleware used after it will be subject to the paywall

## Usage

Copy the `example` directory in this project. `index.js` exposes the api endpoint
you want behind the paywall[1]. Make sure you have [now](https://zeit.co/now) and
[OpenNode](https://opennode.co) setup, then in the directory run:

```bash
# in the project directory copied from `example`
$ now -e OPEN_NODE_KEY=[OpenNode API Key] -e CAVEAT_KEY=[Macaroon Signing Key]
```

A self-hosted node is also supported though additional configs are required.
See [`boltwall`](https://github.com/boltwall-org/boltwall) for more information on configuration.

### Authorization Flow and REST API

Information about the lightning node to interact with can be retrieved via the endpoint `GET */node`

In order to get access to a protected endpoint the client must:

1. Generate an invoice at `POST */invoice` with body containing
   [relevant properties](https://app.swaggerhub.com/apis-docs/prism8/boltwall/1.0.0#/default/generateInvoice)
1. Pay the invoice request returned from the above call using your lightning node
1. `GET */invoice` to check status and get discharge macaroon (this will also be attached to the current
   client's session)
1. Protected content is now accessible for the amount of time paid for.

Check out the [REST API docs](https://app.swaggerhub.com/apis-docs/prism8/boltwall/1.0.0#/) for
additional information.

## Overview

The Boltwall Builder is a relatively simple lambda service built with Zeit's Now service.
It serves two primary functions:

1. Generate invoices for payments based off of received criteria (time based by default: 1 satoshi/second)
2. Supports 3rd party, oAuth-style authentication by returning a discharge macaroon after successful payment

In practice, what this means is that you can put this API layer in front of a compatible lightning node
(either hosted via OpenNode or your own lnd node) to provide users with an authorization that can be used in another application or as a paywall in front of your own protected content.

[Prism](https://prismreader.app) is an example of a 3rd party application that lets users host their own
oAuth-like authentication payment systems. In this case, the app is waiting until a user has authenticated with
the owner of a document that is being shared on the platform. The user pays the owner of the content, which
authenticates you with the app. With the `now-boltwall` module, you can quickly spin up your own paywall
that Prism can use for authenticating time-based access or simply use it as a paywall in front of your own
protected content.

## Installation

Setting up your own ln-builder payments gateway can be done in just a few steps (most are related to
creating accounts to enable deployment).

#### Setup Zeit

1. Create a [free Zeit account](https://zeit.co/signup) for serverless deployments
2. [Install the `now` cli](https://zeit.co/download) for deploying projects directly from your computer

#### Setup Open Node (altneratively can get the configs for your own LND node)

3. [Create an OpenNode account](https://dev.opennode.co/dashboard) on their dev platform [2]
4. Generate an API key to authenticate with your OpenNode dev account. This will allow you to generate invoices
   and check on the status of payments. **Make sure you save this as you will need it for later steps**

#### Setup deployment

5. In the project where you want to enable the paywall, setup a `now.json`
   configuration file, and use the `@now/node` builder for the endpoint
   you would like protected. See `example/now.json` in this repo for a sample
   route that is protected behind the `/api` endpoint.
6. Copy the `example/index.js` file for a route that will only be accessible when a
   a client has properly paid an invoice.
7. Generate or come up with another passphrase. This is called your `Caveat Key` and is used to sign
   discharge macaroons so third parties can verify this came from your server.
8. Next we need to save our secrets for deployment. Once the `now` cli is installed, run the following command
   (Make sure to replace anything in brackets `[ ]` with your own secrets generated above):

```bash
now secrets add open-node-key "[OPEN_NODE_KEY]" # generated in step 4
now secrets add caveat-key "[CAVEAT_KEY]" # generated in step 6
```

9. Run `now` in your project directory. Zeit will now deploy your now-boltwall service and return the uri where it is hosted. Save this and the caveat key (i.e. the passphrase created earlier in step 6)

## Time-based authorization

By default `now-boltwall` will use time-based authorization, giving 1 second of access for every 1 satoshi
paid. This can be disabled with the environment variable `TIME_CAVEAT` set to `false`.

## Additional Information

See more about the API [here](https://app.swaggerhub.com/apis-docs/prism8/boltwall/1.0.0#/)

Read more about how `boltwall` works and how you can use `boltwall` directly as a middleware in your own
`expressjs` application [here](https://github.com/boltwall-org/boltwall)
