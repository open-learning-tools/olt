# peertube-theme-olt

Open Learning Tools brand theme for PeerTube. Re-skins the default UI to match the OLT wrapper landing page and the [olt.academy](https://olt.academy) marketing site:

- Cream background (`oklch(0.985 0.006 230)` ~ `#F8F8F4`)
- Navy primary text and CTAs (`oklch(0.32 0.09 255)` ~ `#1F2A55`)
- Turquoise accent (`oklch(0.7 0.1 200)` ~ `#4FBED1`)
- Hairline borders, 14px card radius, pill-shaped buttons
- Inter sans-serif with Instrument Serif italic accent (via `.olt-italic`)

## Hooks

The theme maps OLT brand tokens onto PeerTube's CSS custom-property surface:

- Core: `--bg`, `--fg` and the `--fg-50..500` gradient
- Surfaces: `--bg-secondary-200..600`
- Brand: `--primary`, `--on-primary`, `--primary-50..700`, `--on-primary-300..500`
- Header: `--header-bg`, `--header-bg-200..600`, `--header-fg-50..500`
- Side menu: `--menu-bg`, `--menu-fg`, `--menu-bg-200..600`, `--menu-fg-50..600`, `--menu-border-radius`
- Inputs: `--input-bg`, `--input-fg`, `--input-bg-in-secondary`, `--input-bg-in-modal`, `--input-border-color`, `--input-border-radius`, `--input-placeholder-color`
- Borders: `--border-primary`, `--border-secondary`
- Alerts: `--alert-primary-fg`, `--alert-primary-bg`, `--alert-primary-border-color`
- Icons: `--secondary-icon-color`, `--active-icon-color`, `--active-icon-bg`
- Player: `--pt-player-fg`, `--pt-player-big-play-bg`, `--pt-player-overlay-secondary-fg`, `--pt-player-overlay-secondary-bg`

It also adds component-level CSS for cards, tables, modals, tabs, scrollbars, the search bar, and the video.js control bar so the OLT look extends past the variables PeerTube exposes.

## Installation

The theme is installed and activated automatically by `bootstrap-plugin.sh` in this repo. To enable it manually you can also run:

```sh
npm install /path/to/peertube-theme-olt
```

…then activate it in **Administration -> Configuration -> Advanced -> Default theme** as `peertube-theme-olt`.

## Limitations

PeerTube's instance avatar/banner and the default-instance favicon are stored as DB-backed instance settings, not theme assets. To finish the OLT look those need to be uploaded once via **Administration -> Configuration -> Instance** (this is a one-time admin action and is outside the theme plugin's scope).
