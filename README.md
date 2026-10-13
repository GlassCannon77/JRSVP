# Knock Knock: party invitations

Seasonal party invitations with RSVPs, a live guest list, a photo wall and free QR codes. Guests never sign in or download anything. It runs on Netlify, and Netlify Functions and Netlify Blobs handle the RSVPs and photos, so you don't need Firebase or any other service.

## What it does

- **12 themes:** Halloween, Friendsgiving, Christmas, Hanukkah, New Year's Eve, New Year's Day, Valentine's, St. Patrick's, Spring & Easter, Fourth of July, Birthday and Classic. Each theme has its own colors, fonts, emblem, animation (bats, leaves, snow, confetti, fireworks, balloons…), wording and a fun RSVP question.
- **Full customization:**
  - Change the background, card, text and accent colors.
  - Pick headline and text fonts.
  - Swap the animation or turn it off.
  - Rewrite every heading and button.
  - The builder shows a live phone preview as you change things.
- **RSVPs without sign-in:**
  - Guests answer yes / maybe / no, bring extra guests, answer your question and leave you a private note.
  - They can change their answer later, or remove their RSVP, from the same phone.
- **Guest list:**
  - Shows on the invite, or you can hide it.
  - Contact details and notes are only visible to you.
- **Photo wall:**
  - Guests scan the party QR code and land on a photo drop page (`/e/:id/photos`) with two big buttons, Take a photo and Choose from your photos. No app or sign-in.
  - Photos are shrunk on the phone before upload, and thumbnails keep the wall fast.
  - Tapping a photo opens a full-screen viewer with a big close button. Swipe to browse; back, Escape or tapping outside also close it.
  - Guests can remove photos they added (right after uploading, or later from the photo wall on the same phone). They can't touch anyone else's.
  - **Save all photos** on the host page: on a phone, saves them to your camera roll through the share sheet (in groups of 20); anywhere, downloads one ZIP file.
- **Free QR codes for every invite:**
  - The encoder is bundled in the site, so there's no QR service, API key or watermark.
  - Each invite has a code for the invitation and one for the photo drop.
  - Download either as a themed 1080×1350 card or print it as a full-page letter-size sign.
- **Host page:**
  - Headcount including extra guests, plus RSVPs you can filter.
  - Download the RSVPs as a spreadsheet (CSV).
  - Remove any guest or any photo (two taps, so nothing goes by accident).
  - Quick switches (close RSVPs, pause uploads), photo moderation, edit and delete.
- **Calendar and maps:** guests get "Add to calendar" (Apple/Outlook .ics), Google Calendar and Directions buttons.
- **Link previews:** a texted invite shows the party name, hosts and date in the message preview.

## Put it online (about 10 minutes)

Netlify's drag-and-drop upload won't work here, because it skips the server functions that store RSVPs and photos. Use one of these instead.

### Option A: GitHub + Netlify (recommended)

1. Create a new GitHub repository and upload this folder's contents to it. Leave out `node_modules`.
2. In Netlify, choose **Add new project → Import an existing project → GitHub**, then pick the repo.
3. Leave the build settings as they are. `netlify.toml` already sets them.
4. Click **Deploy**. Netlify installs `@netlify/blobs`, and Blobs storage turns on automatically.
5. Open your site at `https://<your-site>.netlify.app`, make an invitation, and send the guest link.

Every later push to GitHub redeploys the site.

### Option B: Netlify CLI

```bash
npm install
npm install -g netlify-cli
netlify login
netlify init        # create or link a Netlify site
netlify deploy --prod
```

### Recommended: lock invitation creation

By default anyone who finds your site can create invitations on it. To require a passcode:

1. In Netlify, go to **Site configuration → Environment variables**.
2. Add `HOST_PASSCODE` with a value only you know.
3. Redeploy.

The builder will then ask for the passcode before creating an invitation. Guests never need it.

## Run it on your computer

```bash
npm install
npx netlify-cli dev     # opens http://localhost:8888 with local storage
```

## Your host link

When you create an invitation you get two links:

- **Guest link** (`/e/abc123`): send this to everyone.
- **Host link** (`/e/abc123/host#k=…`): this is your key to manage the party. It's saved on the device you created the party on, but copy it somewhere safe too. Anyone with it can see contact details, remove RSVPs and delete photos.

## Costs and limits

Netlify's free plan gives 300 credits a month. When they run out, the site pauses until the next month rather than charging you. As of 2026, each production deploy uses 15 credits, bandwidth is 20 credits per GB, and function compute is 10 credits per GB-hour. A typical party (dozens of guests, a few hundred photos) uses a small part of that. Check Netlify's pricing page for current numbers.

Built-in limits per party:

- 500 RSVPs
- 400 photos
- 20 photos per upload
- Photos are stored at up to 1600 px

## Project layout

```
netlify.toml                       routes and build settings
netlify/functions/api.mjs          REST API: events, RSVPs, photos (Netlify Blobs)
netlify/functions/invite-page.mjs  serves /e/:id with link-preview tags
public/index.html                  builder with live preview
public/invite.html                 guest invitation
public/host.html                   host page
public/photos.html                 photo drop page the photo QR code opens
public/poster.html                 printable QR sign
public/js/themes.js                theme presets: colors, fonts, wording, motifs
public/js/motifs.js                canvas animations
public/js/icons.js                 theme emblems
public/js/qr.js                    QR drawing and downloadable cards
public/js/viewer.js                full-screen photo viewer
public/js/save-photos.js           Save all photos (share sheet and ZIP)
public/vendor/qrcode.js            QR encoder (Kazuhiko Arase, MIT license)
```

### Adding a theme

Add an entry to `THEMES` and `THEME_ORDER` in `public/js/themes.js`, and add its id to the `THEMES` list at the top of `netlify/functions/api.mjs`.
