<p align="center">
  <img src="public/Soullinktracker-Logo.png" alt="Soullink Tracker Logo" width="200" />
</p>

<h1 align="center">Soullink Tracker</h1>

<p align="center">
  <b>A real-time collaborative Soullink &amp; Nuzlocke Tracker – built for streamers, friend groups, and challenge runners.</b>
</p>

<p align="center">
  <!-- Latest release -->
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/releases"><img src="https://img.shields.io/github/v/release/joos-too/pokemon-soullink-tracker?style=for-the-badge&color=blue" alt="Release" /></a>&nbsp;
  <!-- Uptime -->
  <img src="https://status.freakmedialp.de/api/badge/32/uptime?style=for-the-badge" alt="Uptime" />&nbsp;
  <!-- Open issues -->
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/issues"><img src="https://img.shields.io/github/issues/joos-too/pokemon-soullink-tracker?style=for-the-badge" alt="Issues" /></a>&nbsp;
  <!-- Stars -->
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/stargazers"><img src="https://img.shields.io/github/stars/joos-too/pokemon-soullink-tracker?style=for-the-badge&color=f5c542" alt="Stars" /></a>&nbsp;
  <!-- Contributors -->
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/graphs/contributors"><img src="https://img.shields.io/github/contributors/joos-too/pokemon-soullink-tracker?style=for-the-badge" alt="Contributors" /></a>&nbsp;
</p>

<p align="center">
  <img src="public/screenshots/showcase-dark.png" alt="Tracker Overview">
</p>

---

# Features

## Pokémon tracking

- **Team · Box · Graveyard** — manage your entire run in one place
- **Soullink pairing** — link Pokémon between partners per route
- **Nicknames & routes** — every link records the catch location and player-assigned nicknames
- **Run statistics** — total runs, best attempt, deaths per gym, and Elite Four item counts
- **Hardcore mode** — optional toggle that enforces stricter rules

## Progress tracking

- **Badge tracker** with official badge sprites for every supported game
- **Level caps & rival caps** — preset per game version so you never overlevel
- **Elite Four & Champion progress** — with character art for every region
- **Fossil & stone tracking** — pickup, bag, and usage status per generation

## Game support

The tracker currently supports all versions **up to Gen 6**, with accurate Level-Caps and Rival-Battles. Newer regions and
were not added, as they introduced different approaches to progression, like challenges instead of Gyms.
Nonetheless, all Pokémon and Items, up to from Gen 9 are available if you select a "Custom Tracker" and plan to
play a modified version, which takes place in a region from Gen 1 to Gen 6, but has Pokémon from Gen 7+ or higher.

| Generation | Games                                             |
| ---------- | ------------------------------------------------- |
| Gen 1      | Red / Blue, Yellow                                |
| Gen 2      | Gold / Silver, Crystal                            |
| Gen 3      | Ruby / Sapphire, Emerald, FireRed / LeafGreen     |
| Gen 4      | Diamond / Pearl, Platinum, HeartGold / SoulSilver |
| Gen 5      | Black / White, Black 2 / White 2                  |
| Gen 6      | X / Y, Omega Ruby / Alpha Sapphire                |
| Gen 7+     | Custom                                            |

## Real-Time Collaboration

- **Instant sync** — powered by Firebase Realtime Database; every change is live
- **Roles** — Owner, Editor, and Guest access levels
- **Invite system** — add members by email
- **Public sharing** — expose a read-only link for viewers or stream overlays

## Rulesets

- **Preset rulesets** — Solo, Duo, and Trio templates in English & German
- **Custom rulesets** — create, save, and reuse your own rule sets
- **Tags** — filter rulesets by Solo / Duo / Trio and language

## Sprites & Visuals

- **Animated & static sprites** — sourced from the PokeAPI sprite repository
- **Shiny variants** — toggle between regular and shiny artwork
- **Generation-accurate sprites** — optionally display the sprite style matching the game generation
- **Mega Stone sprite styles** — choose between item icon or Pokémon artwork
- **Offline image caching** — a service worker caches sprites for instant loading

## Localization

- Full **English** and **German** UI
- Pokémon names translated in both languages via generated datasets

---

## Credits & Acknowledgments

| Resource                                              | Usage                                                   |
| ----------------------------------------------------- | ------------------------------------------------------- |
| [PokéAPI](https://pokeapi.co/)                        | Pokémon species data, evolution chains, and sprite URLs |
| [PokéWiki](https://www.pokewiki.de/)                  | German Pokémon names and game references                |
| [PokeAPI Sprites](https://github.com/PokeAPI/sprites) | Animated and static Pokémon sprite images               |

Pokémon and all related names are trademarks of Nintendo / Creatures Inc. / GAME FREAK Inc. This project is a fan-made tool and is not affiliated with or endorsed by any of these companies.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, architecture details, coding conventions, and how to submit a pull request.

_Have an idea? [Open an issue!](https://github.com/joos-too/pokemon-soullink-tracker/issues)_

---

<p align="center">
  Made with love for the Pokémon Nuzlocke community
</p>
