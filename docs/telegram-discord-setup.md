# Telegram + Discord Setup Guide (CHIEF)

Follow these steps yourself — both platforms require your own phone number/account
to create a channel or server, so this can't be automated. Copy/paste content is
pulled directly from `docs/social-launch-kit.md` so it stays consistent everywhere.

## Telegram

1. Open Telegram (app or web.telegram.org) on your phone/account.
2. Create a new **Channel** (not a group) named: `CHIEF Token Official`
   - This is the announcements channel — one-way broadcast.
3. Set the channel picture to the CHIEF wordmark/logo (`chief-coin-256.png` in this repo).
4. Set the channel description to:
   > CHIEF on Base. Weekly ecosystem briefs, builder tools, and Utility Pass access. Educational only. Not financial advice.
5. Post the pinned first message (from `social-launch-kit.md`):
   > CHIEF Utility Pass is live.
   >
   > What you get:
   > - Weekly high-signal CHIEF market + ecosystem brief
   > - Members-only execution templates
   > - Office hour + priority support on higher tiers
   >
   > Choose your plan: https://officialchieftoken.com/checkout
   >
   > Built on Base. Educational only.
6. Pin that message.
7. Create a **second, separate group** for discussion (Telegram channels don't support replies): name it `CHIEF Token Discussion`.
   - Link the discussion group to the channel via Channel Settings → Discussion.
8. Get the public invite link for the channel: Channel Settings → **Invite Links** → copy the `t.me/...` link.
9. Send me that `t.me/...` link and I will update it into `listing/token-profile.json` and the three exchange listing drafts (currently placeholders).

## Discord

1. Open Discord, click **+** → **Create My Own** → name the server `CHIEF Token`.
2. Upload the CHIEF logo as the server icon.
3. Create these channels (from `social-launch-kit.md`):
   - `#start-here`
   - `#announcements`
   - `#weekly-brief`
   - `#templates`
   - `#office-hours`
   - `#support`
4. In `#start-here`, pin a welcome message with the compliance footer:
   > Educational and informational only. Nothing is financial, legal, or tax advice.
5. Set moderation baseline (Server Settings → Moderation):
   - No scam links
   - No impersonation
   - No financial guarantees (auto-mod keyword filters recommended for "guaranteed", "100x", etc.)
6. Generate a permanent invite link: right-click server name → **Invite People** → edit link to **Never expire**.
7. Send me that `discord.gg/...` link and I will update it the same way as the Telegram link.

## After both are live

Once you send me both links, I will:
- Replace the placeholder Telegram/Discord URLs in `listing/token-profile.json`
- Update `listing/coinbase-asset-hub-draft.md`, `coingecko-submission-draft.md`, `coinmarketcap-submission-draft.md`
- Re-run `npm run listing:validate` and `npm run launch:readiness` to confirm everything still passes
