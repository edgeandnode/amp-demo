# Troubleshooting Guide

This guide covers common issues you might encounter when working with Amp and how to resolve them.

## Quick Fixes

### "Unknown dataset reference '\_/counter@latest'"

**Cause:** Development datasets use `@dev`, not `@latest`.

**Solution:**
```bash
# ❌ Incorrect - omitting @dev defaults to @latest
pnpm amp query 'SELECT * FROM "_/counter".incremented'

# ✅ Correct - explicitly use @dev for local datasets
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented'
```

**Why:** The `@dev` tag identifies unpublished local datasets. Published datasets use version numbers like `@1.0.0` or the `@latest` tag.

### No Data in Tables

**Cause:** No transactions have been generated yet.

**Solution:** Interact with the frontend to generate events:
1. Open http://localhost:5173
2. Click the increment/decrement buttons
3. Wait a few seconds for blocks to be mined
4. Try your query again

**Verify events exist:**
```bash
# Check if any events have been emitted
pnpm amp query 'SELECT COUNT(*) FROM "_/counter@dev".incremented'
```

### Config Changes Not Applying

**Cause:** Amp services cache dataset configurations and need a full restart.

**Solution:**
```bash
just down  # Stop all services and clean volumes
just up    # Restart infrastructure and redeploy
```

**Why:** Dataset configurations are registered when services start. Changes require re-registration.

### Dataset Not Deploying

**Symptoms:**
- Queries return "dataset not found"
- No data directories created in `infra/amp/data/`
- Build completes but no tables appear

**Debug Steps:**

1. **Check service logs:**
```bash
docker compose -f infra/docker-compose.yaml logs amp | grep counter
```

2. **Verify data directory:**
```bash
ls -la infra/amp/data/
```
You should see a `counter/` directory.

3. **Try manual deployment:**
```bash
pnpm ampctl dataset deploy _/counter@dev
```

4. **Validate your configuration:**
```bash
pnpm amp build -o /tmp/test-manifest.json
```

**Common Causes:**
- SQL syntax errors in derived tables
- Streaming model violations (see [streaming.md](streaming.md))
- Services not fully started (wait for `just up` to complete)
- Network connectivity issues with local Anvil node

### Build Errors

#### "non-incremental operation: Limit"

**Cause:** Using `LIMIT` in a derived table definition.

**Solution:** Remove `LIMIT` from the SQL in `amp.config.ts`. Use a block_num `WHERE` filter which is supported by streaming queries. Or use `LIMIT` in a batch ad-hoc query instead:

```typescript
// ❌ Invalid - LIMIT in table definition
tables: {
  recent_blocks: {
    sql: `SELECT * FROM anvil.blocks LIMIT 100`,
  },
}

// ✅ Valid derived dataset query - No LIMIT in definition, use a WHERE filter instead
tables: {
  all_blocks: {
    sql: `SELECT * FROM anvil.blocks WHERE _block_num > 100`,
  },
}
```

Query the derived dataset with LIMIT:
```bash
pnpm amp query 'SELECT * FROM "_/counter@dev".all_blocks LIMIT 100'
```

#### "non-incremental operation: Order"

**Cause:** Using `ORDER BY` in a derived table definition.

**Solution:** Remove `ORDER BY` from the table definition. Use it when querying:

```bash
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented ORDER BY block_num DESC'
```

#### "non-incremental operation: Aggregate"

**Cause:** Using `GROUP BY`, `COUNT()`, `SUM()`, or other aggregates in a derived table.

**Solution:** Remove aggregates from the table definition. Use them at query time:

```bash
pnpm amp query '
  SELECT block_num, COUNT(*) as event_count
  FROM "_/counter@dev".incremented
  GROUP BY block_num
'
```

See [streaming.md](streaming.md) for a complete guide to streaming limitations.

#### "invalid value 'dev' for '--tag'"

**Cause:** Using `-t dev` flag with Amp CLI commands.

**Solution:** Don't use the `-t` flag. Use `@dev` in the dataset reference instead:

```bash
# ❌ Incorrect
pnpm amp query -t dev 'SELECT * FROM "_/counter".incremented'

# ✅ Correct
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented'
```

### Services Won't Start

**Symptoms:**
- `just up` fails or hangs
- Docker containers crash immediately
- Port conflicts

**Solutions:**

1. **Check Docker is running:**
```bash
docker ps
```

2. **Check for port conflicts:**
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :8545  # Anvil
lsof -i :1602  # Amp
```

3. **Stop conflicting services:**
```bash
# If you have other Postgres instances running
brew services stop postgresql

# If you have other Anvil instances
killall anvil
```

4. **Clean Docker state:**
```bash
just down
docker system prune -f
just up
```

5. **Verify required software versions:**
```bash
node --version    # Should be v22+
pnpm --version    # Should be v10+
docker --version
forge --version
just --version
amp --version
```

### Queries Timing Out

**Cause:** Querying too much data or complex joins.

**Solutions:**

1. **Add LIMIT to queries:**
```bash
pnpm amp query 'SELECT * FROM anvil.blocks LIMIT 100'
```

2. **Use more specific WHERE clauses:**
```bash
# ✅ Good - Filters on indexed column
pnpm amp query '
  SELECT * FROM anvil.logs
  WHERE address = '\''0x...'\''
  LIMIT 10
'
```

3. **Create a derived table with pre-filtered data:**
```typescript
tables: {
  filtered_logs: {
    sql: `
      SELECT * FROM anvil.logs
      WHERE address = '0x...'
    `,
  },
}
```

4. **Check Amp service health:**
```bash
docker compose -f infra/docker-compose.yaml ps
docker compose -f infra/docker-compose.yaml logs amp
```

### Frontend Not Connecting

**Symptoms:**
- Frontend loads but shows no data
- Console errors about connection failures
- "Failed to fetch" errors

**Solutions:**

1. **Verify Amp dev server is running:**
```bash
# Should see both "Frontend" and "Amp Dev Server" running
just dev
```

2. **Check environment variables in `app/.env`:**
```bash
cat app/.env
```
Should contain the correct Amp server URL.

3. **Verify dataset is deployed:**
```bash
pnpm amp query 'SELECT COUNT(*) FROM "_/counter@dev".incremented'
```

4. **Check browser console for specific errors:**
Open DevTools (F12) and look for network errors.

## Advanced Debugging

### Inspecting Database Directly

Amp uses PostgreSQL internally. You can connect to it:

```bash
# Access Adminer web UI
open http://localhost:7402

# Or use psql
docker exec -it amp-postgres psql -U postgres -d amp
```

**Useful queries:**
```sql
-- List all datasets
SELECT * FROM datasets;

-- Check dataset status
SELECT name, status, error FROM datasets WHERE name = 'counter';
```

### Viewing Detailed Logs

```bash
# All services
just logs

# Specific service
docker compose -f infra/docker-compose.yaml logs -f amp

# Filter for errors
docker compose -f infra/docker-compose.yaml logs amp | grep ERROR
```

### Resetting Everything

If you want a completely clean slate:

```bash
# Stop services and remove all data
just down

# Remove generated files
rm -rf infra/amp/data/
rm -rf infra/amp/datasets/

# Restart
just up
```

### Testing Anvil Connection

Verify Amp can connect to your local Anvil node:

```bash
# Check Anvil is running
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Should return block number in hex
```

### Manually Building Dataset

To test if your dataset configuration is valid:

```bash
# Build without deploying
pnpm amp build -o /tmp/manifest.json

# Check the output
cat /tmp/manifest.json | jq
```

## Common Error Messages

### "table does not exist"

**Cause:** Querying a table that hasn't been created or deployed.

**Check:**
1. Is the table defined in `amp.config.ts`?
2. Did you restart services after adding it? (`just down && just up`)
3. Is the dataset name and tag correct in your query?

### "column does not exist"

**Cause:** Referencing a column that doesn't exist in the table.

**Check:**
1. View table schema:
```bash
pnpm amp query 'DESCRIBE "_/counter@dev".incremented'
```

2. Verify column names match exactly (case-sensitive).

### "parse error"

**Cause:** SQL syntax error in query or config.

**Check:**
1. Are quotes escaped properly?
2. Is the dataset reference quoted? `"_/counter@dev"`
3. Is your SQL valid DuckDB syntax?

### "cannot read properties of undefined"

**Cause:** Usually a TypeScript/JavaScript error in the frontend.

**Check:**
1. Is data being returned from the query?
```typescript
console.log('Query result:', data);
```

2. Are you checking if data exists before accessing it?
```typescript
if (!data || data.length === 0) return <div>No data</div>;
```

## Performance Issues

### Slow Queries

1. **Filter derived table:**
```typescript
tables: {
  indexed_logs: {
    sql: `
      SELECT * FROM anvil.logs
      WHERE address IN ('0x...', '0x...')
    `,
  },
}
```

2. **Use EXPLAIN to understand query plans:**
```bash
pnpm amp query 'EXPLAIN SELECT * FROM anvil.blocks'
```

3. **Limit data scanned:**
```bash
# Add block_num filters to reduce scan size
pnpm amp query '
  SELECT * FROM anvil.logs
  WHERE block_num > 1000000
  LIMIT 100
'
```

### High Memory Usage

1. **Reduce result set sizes:**
Use `LIMIT` and specific `WHERE` clauses.

2. **Create more focused derived tables:**
Instead of one large table, create multiple smaller tables.

3. **Restart services periodically:**
```bash
just down && just up
```

## Still Stuck?

If you're still having issues:

1. **Check the docs:**
   - [streaming.md](streaming.md) - SQL limitations
   - [Configuration Guide](https://github.com/edgeandnode/amp/blob/main/docs/config.md) - Configuration reference
   - [Glossary](https://github.com/edgeandnode/amp/blob/main/docs/glossary.md) - Terminology

2. **Search existing issues:**
   Visit the GitHub repository and search for similar problems.

3. **Open an issue:**
   Provide:
   - Error messages (full text)
   - Your `amp.config.ts`
   - Steps to reproduce
   - Output of `just logs`

4. Come chat with our team! We'll be hanging out at EthGlobal hackathon 

---

# Command Reference

Complete reference of available commands and their usage.

## Just Commands

The `justfile` provides convenient task runners:

### Basic Operations

```bash
# Install all dependencies (npm + Foundry)
just install

# Start infrastructure, deploy contracts, register datasets
just up

# Run frontend and Amp dev server in parallel
just dev

# Stop all services and clean volumes
just down

# Open Amp Studio (web-based query interface)
just studio

# View logs from all services
just logs

# View logs from specific service
just logs <service-name>  # e.g., just logs amp

# Stop specific service
just stop <service-name>
```

### What `just up` Does

Runs these steps automatically:
1. Starts Docker Compose services (PostgreSQL, Anvil, Amp, Adminer)
2. Waits for Anvil to be ready
3. Deploys the Counter smart contract using Foundry
4. Registers the `_/anvil@0.0.1` dataset
5. Registers your custom `_/counter@dev` dataset

### What `just dev` Runs

Starts two processes in parallel:
1. **Frontend** (`pnpm dev`) - Vite dev server on http://localhost:5173
2. **Amp Dev Server** (`pnpm amp dev`) - Watches `amp.config.ts` for changes

### What `just down` Does

1. Stops all Docker Compose services
2. Removes volumes (clears all data)
3. Cleans up temporary files

## Amp CLI Commands

Direct Amp command-line interface:

### Querying

```bash
# Run a SQL query
pnpm amp query "<sql>"

# Examples
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented LIMIT 10'
pnpm amp query 'SELECT COUNT(*) FROM anvil.blocks'

# Multi-line queries
pnpm amp query '
  SELECT block_num, COUNT(*) as tx_count
  FROM anvil.transactions
  GROUP BY block_num
  ORDER BY block_num DESC
  LIMIT 5
'
```

### Building and Deploying

```bash
# Build dataset manifest (validates SQL)
pnpm amp build

# Build and output to specific file
pnpm amp build -o /tmp/manifest.json

# Start development server
pnpm amp dev

# Deploy specific dataset manually
pnpm ampctl dataset deploy _/counter@dev
```

### Development Server

```bash
# Start Amp dev server (watches for config changes)
pnpm amp dev

# With specific config file
pnpm amp dev --config amp.config.custom.ts
```

## Docker Compose Commands

For finer control over services:

```bash
# View running containers
docker compose -f infra/docker-compose.yaml ps

# View logs
docker compose -f infra/docker-compose.yaml logs -f

# View logs for specific service
docker compose -f infra/docker-compose.yaml logs -f amp

# Restart specific service
docker compose -f infra/docker-compose.yaml restart amp

# Stop specific service
docker compose -f infra/docker-compose.yaml stop amp

# Start specific service
docker compose -f infra/docker-compose.yaml start amp

# Execute command in container
docker compose -f infra/docker-compose.yaml exec amp sh
```

### Services Started by Docker Compose

- **PostgreSQL** (port 5432) - Database backend for Amp
- **Anvil** (port 8545) - Local Ethereum test node
- **Amp** (ports 1602, 1603, 1610) - Data processing engine
- **Adminer** (port 7402) - Database explorer web UI

## Foundry Commands

Smart contract development:

```bash
# Compile contracts
cd contracts && forge build

# Run tests
cd contracts && forge test

# Deploy contract
cd contracts && forge script script/Counter.s.sol --rpc-url http://localhost:8545 --broadcast

# View contract ABI
cd contracts && forge inspect Counter abi
```

## PNPM Commands

Package management:

```bash
# Install dependencies
pnpm install

# Run frontend dev server
cd app && pnpm dev

# Build frontend for production
cd app && pnpm build

# Run Amp commands
pnpm amp <command>
pnpm ampctl <command>
```

## Common Workflows

### Full Reset

When you need to start completely fresh:

```bash
just down
rm -rf infra/amp/data/ infra/amp/datasets/
just up
just dev
```

### Update Dataset Configuration

After modifying `amp.config.ts`:

```bash
just down
just up
# Your changes are now live
```

### Test New SQL Before Deploying

```bash
# Validate syntax
pnpm amp build -o /tmp/test.json

# Or prototype interactively
just studio
```

### Deploy to Production

See [docs/hosted-env.md](hosted-env.md) for publishing datasets to the hosted service.

### Debug Dataset Issues

```bash
# Check if dataset is registered
docker compose -f infra/docker-compose.yaml logs amp | grep counter

# Verify data directory exists
ls -la infra/amp/data/counter/

# Try manual deployment
pnpm ampctl dataset deploy _/counter@dev

# Check database
open http://localhost:7402
```

## Environment Variables

Key environment variables you can modify:

### In `infra/docker-compose.yaml`

```yaml
# Postgres configuration
POSTGRES_USER: postgres
POSTGRES_PASSWORD: password
POSTGRES_DB: amp

# Amp configuration
AMP_DATABASE_URL: postgresql://postgres:password@postgres:5432/amp
```

### In `app/.env`

```bash
# Amp server URL for frontend
VITE_AMP_URL=http://localhost:1602
```

### In Shell

```bash
# Override Amp server URL
export AMP_URL=http://localhost:1602
pnpm amp query 'SELECT * FROM "_/counter@dev".incremented'
```

See the [Configuration Guide](https://github.com/edgeandnode/amp/blob/main/docs/config.md) for complete configuration reference.