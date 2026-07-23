# New Side Panel — Mosaic mock

Interactive mock of the journey-builder side panel redesign, on Mosaic/TIP foundations.
Visuals follow the Figma file [New side panel](https://www.figma.com/design/rZLg3e6ZKhbrsYVGuXLXxG/New-side-panel)
(tokens pulled via the Figma MCP: Plus Jakarta Sans, Action Primary #6981FF ramp, status and
category colors). Behaviors follow `side-panel-handshake-draft.md`.

No build step, no npm, no JFrog. Static files only.

## Run

```bash
cd ~/repos/side-panel-mock
python3 -m http.server 4173
```

Open http://localhost:4173

## What to try

- Click a step → panel opens in **View** (read-only, configured-only). Explicit **Edit** toggle.
- Hover a node → View / Edit / Duplicate / Delete quick actions; ⋮ has docs / pin / breakpoint.
- The eye-slash on every node is the per-step **visibility** toggle (pairs with "Steps visibility" in the toolbar).
- **Edit**: collapsible sections per the Figma grammar (Step title & description, Configuration,
  Credentials, Output, Failure & cancel behavior, Custom branches), expression fields with
  `</>` prefix + pencil editor, steppers, method toggles, add/remove custom branches
  (branch names update the canvas node live), Schema editor modal.
- Two fields start broken (Password authentication → Password; Email validation → branch display
  name). They stay **neutral until touched**. Click **Save** → red readiness list under the button;
  rows jump to the field. Fix both → Save morphs into **Publish**.
- **Preview** on user-facing steps only, per-step screens, desktop/mobile.
