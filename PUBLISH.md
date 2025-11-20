# Publishing your Amp Dataset

Ready to publish? Follow these steps to publish your Amp Dataset, making it publicly available to view and query.

1. **Update your Dataset Metadata**

   - The [amp.config.ts](./amp.config.ts) allows you to specify additional metadata defining/describing your dataset.

     - `namespace` (REQUIRED) this is a logical namespace/organization for your datasets. Could be your 0x address, ens name, your organization, etc.
     - `network` (REQUIRED) What chain/network will your dataset consume data from
     - `ethereum-mainnet`
     - `arbitrum-one`
     - `base-mainnet`

     - `description` (OPTIONAL, recommended) description on what your dataset is for, its use-case, the data it is materializing, etc. This is used for discoverability in the registry.
     - `keywords` (OPTIONAL, recommended) like keywords in your `package.json`, this is an array of key words that help to describe your dataset use-case. Things like `DeFi`, `NFT`, `Art`, etc. Similar to the description, this is used for discoverability in the registry.
     - `readme` (OPTIONAL) show users how to use and query your dataset
     - `sources` (OPTIONAL) an array of your Dataset sources. This is especially useful if your Dataset queries reference contract addresses. Used for discoverability in the registry.
     - `private` (OPTIONAL, default `false`). If true, your Datatset will still be published to the registry, but will be only viewable by you.

2. **Authenticate with the amp cli**

   ```bash
   pnpm amp auth login
   ```

   - This will open a browser and allow you to authenticate with your wallet, or social/email.

3. **Publish with the amp cli**

   ```bash
   pnpm amp publish --tag "0.0.1" --changelog "Initial 0.0.1 release"
   ```

   - `tag`: (REQUIRED) this is the version using semver: `{major}.{minor}.{patch}`
   - `changelog`: Allows you to provide a changelog of changes made to this published version

4. **Generate an auth token with the amp cli**

   ```bash
   pnpm amp auth token --duration "3 days"
   ```

   - `duration`: provide the duration of the auth token before it expires

5. **Update your `.env`**

   - update these values in your `.env` with the published info and generated auth token:
   - `VITE_AMP_QUERY_URL` -> "https://gateway.amp.staging.thegraph.com"
   - `VITE_AMP_QUERY_TOKEN` -> {your auth token generated from the `pnpm amp auth token` cmd}
   - `VITE_AMP_RPC_DATASET` -> the raw dataset your dataset will be derived from
     - `edgeandnode/ethereum_mainnet@0.0.1`
     - `edgeandnode/base_mainnet@0.0.1`
     - `edgeandnode/arbitrum_one@0.0.1`
     - find others: https://playground.amp.thegraph.com/?search=raw
   - `VITE_AMP_NETWORK` -> the chain/network your Dataset is derived from
     - `ethereum-mainnet`
     - `arbitrum-one`
     - `base-mainnet`
   - Make sure your queries reference your dataset reference: `{namespace}/{name}@{tag}`
   - ex:
     - `namespace`: `0xuser`
     - `name`: `ethereum_mainnet_counter`
     - `tag`: `0.0.1`
     - -> `0xuser/ethereum_mainnet_counter@0.0.1`

6. **Query!**

   - Your Amp Dataset is now queryable!
   - Run in your app and try it out (after step 5 above)
   - Run a query through the cli

     ```bash
     pnpm amp query \
      --flight-url https://gateway.amp.staging.thegraph.com \
      --bearer-token {{AUTH_TOKEN}}
      'SELECT * FROM {{DATASET_REFERENCE}}.{{table}} LIMIT 100'
     ```
