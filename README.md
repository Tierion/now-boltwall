# The Lightning Paywall Builder

An easy to deploy gateway for enabling payments and authentication with other compatible applications.

## Usage

Copy the `example` directory in this project. `index.js` exposes the api endpoint
you want behind the paywall[1]. Make sure you have [now](https://zeit.co/now) and
[OpenNode](https://opennode.co) setup, then in the directory run:

```bash
# in the project directory copied from `example`
$ now -e OPEN_NODE_KEY=[OpenNode API Key] -e CAVEAT_KEY=[Macaroon Signing Key]
```

See section below on [architecture](#architecture) for more on what these environment
variables are for.

## Overview

The Lightning Paywall Builder is a relatively simple lambda service built with Zeit's Now service. Currently,
the API supports the specific use case of interacting with the Prism Reader application. It serves two primary functions:

1. Generate invoices for payments based off of received criteria (time based- 1 satoshi/second)
2. Supports 3rd party, OAuth-style authentication by returning a discharge macaroon after successful payment

In practice, what this means is that you can put this API layer in front of a compatible lightning node
(currently the ln-builder only supports the [OpenNode API](https://developers.opennode.co/)) to provide
users with an authorization that can be used in another application.

In the case of [Prism](https://prismreader.app), the app is waiting until a user has authenticated with
the owner of a document that is being shared on the platform. The user pays the owner of the content, which
authenticates you with the app.

## Installation

Setting up your own ln-builder payments gateway can be done in just a few steps (most are related to creating accounts
to enable deployment).

#### Setup Zeit

1. Create a [free Zeit account](https://zeit.co/signup) for serverless deployments
2. [Install the `now` cli](https://zeit.co/download) for deploying projects directly from your computer

#### Setup Open Node

3. [Create an OpenNode account](https://dev.opennode.co/dashboard) on their dev platform [2]
4. Generate an API key to authenticate with your OpenNode dev account. This will allow you to generate invoices
   and check on the status of payments. **Make sure you save this as you will need it for later steps**

#### Setup deployment

5. In the project where you want to enable the paywall, setup a `now.json`
   configuration file, and use the `now-boltwall` builder for the endpoint
   you would like protected. See `example/now.json` in this repo for a sample
   route that is protected behind the `/api/protected` endpoint.
6. Generate or come up with another passphrase. This is called your `Caveat Key` and is used to sign
   discharge macaroons so third parties can verify this came from your server.
7. Next we need to save our secrets for deployment. Once the `now` cli is installed, run the following command.
   Make sure to replace anything in brackets `[ ]` with your own secrets generated above

```bash
now secrets add open-node-key "[OPEN_NODE_KEY]" # generated in step 4
now secrets add caveat-key "[CAVEAT_KEY]" # generated in step 6
```

8. Run `now` in your project directory. Zeit will now deploy your ln-builder service and return the uri where it is hosted.
   Save this and the caveat key (i.e. the passphrase created earlier in step 6)

## Architecture

The below image should give an idea of the authentication flow between the ln-builder api, lightning node,
3rd party App requesting the authentication, and the client being authenticated.
![ln builder diagram](https://raw.githubusercontent.com/bucko13/now-boltwall/master/ln-builder-diagram.jpg 'diagram')

[1]: Full paywall functionality isn't officially supported yet. Currently,
content is managed on another platform and this lambda service gives you an endpoint
for other services to interact with.
[2]: **NOTE** the dev platform interacts with the Lightning Network on testnet. Currently only testnet
is supported but mainnet would be trivial to add in in the future.
