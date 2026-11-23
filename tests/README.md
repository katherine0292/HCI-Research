# Browser interaction regression

Requires Node.js, Playwright in the Node module search path, and Google Chrome.

```sh
python3 -B site-src/build.py
node tests/interactions.cjs
```

To reuse Playwright installed elsewhere, set `PLAYWRIGHT_MODULE=/path/to/playwright`.
Set `BROWSER_CHANNEL` for another installed Chrome/Chromium channel.

To verify the deployed page:

```sh
BASE_URL=https://katherine0292.github.io/HCI-Research/ node tests/interactions.cjs
```

The script starts a temporary local static server when `BASE_URL` is absent. It
uses actual pointer clicks at 1440×900 and 390×844, in English and Chinese, to
check rail/menu navigation, menu closing, theme filters, analysis
and insight tabs, every photo, previous/next, zoom, image dismissal, email copy
and all five reference links. It also checks image-viewer keyboard focus and
Escape behavior, browser errors, image loading, separate click targets for
close/previous/next, and the final menu item at 844×390. A fresh desktop page
also checks the first deep chapter jump, animated rail and image controls with
normal motion enabled.

Reference destination documents are stubbed after clicking; the test verifies
the link and new-tab behavior without depending on a publisher's availability.
It does not modify published content or use the optional local page editor.
