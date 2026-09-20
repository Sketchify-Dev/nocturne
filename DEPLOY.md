# Deploying Nocturne (24/7, public URL)

This gets Nocturne live at a public URL where the agent keeps ticking around the
clock, even when nobody has the tab open. That "it runs while you sleep" property
is the whole premise, so it is worth doing once, carefully.

You need three free accounts. All have a free tier that is plenty for this:

1. **GitHub** - hosts the code (also doubles as a build-in-public artifact) and
   runs the 24/7 scheduler for free through GitHub Actions, which is already
   configured in this repo.
2. **Vercel** - hosts the live app. Signs in with your GitHub account.
3. **Upstash** - a tiny Redis database so the agent remembers its portfolio
   between ticks in production. Signs in with GitHub too.

You do not need any of these to run locally, and you do not need a Qwen key yet.
Without keys the app runs in demo mode; keys switch on the real providers later.

Throughout, lines starting with `!` are commands to run in the chat (the `!`
prefix). Everything else is a click in a browser.

---

## Step 1 - Put the code on GitHub

This folder is not a git repo yet, so we create one and push it.

First, create an empty repo on GitHub:

- Go to https://github.com/new
- Repository name: `nocturne`
- Visibility: **Public** (good for the build-in-public prize; you can make it
  private later if you prefer)
- Do **not** add a README, .gitignore, or license (we already have them)
- Click **Create repository**
- On the next page, copy the HTTPS URL. It looks like
  `https://github.com/YOUR_NAME/nocturne.git`

Now, back here, run these one at a time (replace the URL in the last line with
the one you just copied):

```
!git init
!git add -A
!git commit -m "Nocturne: 24/7 tokenized-equity trading agent"
!git branch -M main
!git remote add origin https://github.com/YOUR_NAME/nocturne.git
!git push -u origin main
```

If `git push` asks for a password, use a **GitHub personal access token**, not
your account password (GitHub no longer accepts passwords on the command line):
create one at https://github.com/settings/tokens -> "Generate new token
(classic)" -> tick the `repo` scope -> paste the token as the password.

When this finishes, refresh the GitHub page; you should see all the files.

---

## Step 2 - Create the Upstash Redis database

- Go to https://console.upstash.com and sign in with GitHub.
- Click **Create Database** (Redis).
- Name: `nocturne`. Pick the region closest to you. Leave the rest default.
- Click **Create**.
- On the database page, scroll to the **REST API** section.
- You need two values from there. Click the copy icons:
  - `UPSTASH_REDIS_REST_URL` (looks like `https://xxx-yyy.upstash.io`)
  - `UPSTASH_REDIS_REST_TOKEN` (a long string)
- Keep this tab open; you paste these into Vercel in the next step.

---

## Step 3 - Make a cron secret

The scheduler ping should not be public, so we protect it with a secret string.
Generate one:

```
!node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

Copy the line it prints. That is your `CRON_SECRET`. Keep it handy.

---

## Step 4 - Import the project into Vercel

- Go to https://vercel.com and sign in with GitHub.
- Click **Add New... -> Project**.
- Find the `nocturne` repo and click **Import**.
- Vercel auto-detects Next.js; leave the build settings as they are.
- Before clicking Deploy, open **Environment Variables** and add these
  (Name on the left, Value on the right). Paste the values you collected:

  | Name | Value |
  |------|-------|
  | `UPSTASH_REDIS_REST_URL` | the Upstash REST URL from Step 2 |
  | `UPSTASH_REDIS_REST_TOKEN` | the Upstash REST token from Step 2 |
  | `CRON_SECRET` | the string from Step 3 |

  Optional, only when you are ready for real AI decisions (you can add these
  later and redeploy):

  | Name | Value |
  |------|-------|
  | `QWEN_API_KEY` | your Bitget hackathon Qwen key |
  | `QWEN_BASE_URL` | `https://hackathon.bitgetops.com/v1` |
  | `QWEN_MODEL` | `qwen3.8-max` |

- Click **Deploy** and wait for it to finish.
- Click the deployment; note your public URL, e.g. `https://nocturne-xxx.vercel.app`.
  Open it: the dashboard loads and, because Upstash is set, its state now
  persists in production.

---

## Step 5 - Turn on the 24/7 tick (GitHub Actions)

This repo already includes the scheduler at `.github/workflows/tick.yml`. It
pings your tick endpoint on a schedule from GitHub's own infrastructure, so the
agent keeps trading with no browser open. You just need to give it the secret.

- On GitHub, open your `nocturne` repo -> **Settings** -> **Secrets and
  variables** -> **Actions**.
- Click **New repository secret**.
  - Name: `CRON_SECRET`
  - Value: the same secret string from Step 3. It must match the one in Vercel
    exactly.
- Click **Add secret**.
- Open the **Actions** tab. If Actions are not enabled yet, click to enable them.
- In the left sidebar select **Nocturne tick**, click **Run workflow**, and
  confirm the run goes green. Green means it returned `200` and advanced the
  agent by one tick.

That is it. GitHub now runs it on its own schedule (about every 5 minutes;
GitHub may batch scheduled runs under load, so the real cadence can stretch,
which is still continuous operation), and the dashboard advances it faster
(throttled to a sane rate) whenever someone is watching.

> Prefer a different scheduler? Any service that can make an HTTPS request on a
> timer works: point it at
> `https://nocturne-xxx.vercel.app/api/cron/tick?secret=PASTE_YOUR_CRON_SECRET`
> (the same secret from Step 3). GitHub Actions is the default here because it
> needs no extra account and lives in the repo.

---

## Verify it is really running 24/7

- Open your public URL, watch the tick count and equity move, then **close the
  tab entirely**.
- Wait a few minutes.
- Reopen the URL. The tick count has gone up while you were away, and the "while
  you were away" recap greets you with what the agent did. That is GitHub Actions
  doing its job with no browser open. You can also watch the runs pile up under
  the repo's **Actions** tab.

---

## Redeploying after a change

Every time you push to GitHub, Vercel redeploys automatically:

```
!git add -A
!git commit -m "your message"
!git push
```

If you add or change environment variables in Vercel, trigger a redeploy for
them to take effect: Vercel dashboard -> your project -> Deployments -> the
latest one -> the "..." menu -> **Redeploy**.

---

## Troubleshooting

- **The tick returns 401 `unauthorized`**: the `CRON_SECRET` GitHub repository
  secret (or the `?secret=` in a custom scheduler's URL) does not match the
  `CRON_SECRET` env var in Vercel. Make them identical, then redeploy Vercel.
- **The GitHub Actions run is red with `curl ... timed out`**: a tick took
  longer than the workflow's wait. The model call is bounded in code (it gives up
  after 45 seconds and falls back), so a one-off red run is usually a slow cold
  start; re-run it. If it persists, check the Vercel function logs for
  `/api/cron/tick`.
- **Cron returns `{"ok":true,"skipped":true}`**: the agent is paused. Open the
  dashboard and press **Start** (that flips the shared state to running), or
  just reset it. New deployments seed a fresh state that is already running.
- **Tick count resets after a while**: the Upstash env vars are missing or wrong
  in Vercel, so production fell back to per-request memory. Recheck both Upstash
  values and redeploy.
- **Everything looks like demo data**: that is expected until you add
  `QWEN_API_KEY`. Live prices from DexScreener need no key and should show
  "Live" on the market card regardless.

---

## What costs money here?

Nothing, at this scale. GitHub (Actions minutes are free on public repos),
Vercel Hobby, and Upstash free all cover this comfortably. The only thing that
eventually costs anything is the Qwen API once you add a real key, and the tick
throttle keeps that bounded even during a busy voting period.
