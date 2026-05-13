<p align="center">
  <img src="public/Soullinktracker-Logo.png" alt="Soullink Tracker Logo" width="200" />
</p>

<h1 align="center">Soullink Tracker</h1>

<p align="center">
  <b>A real-time collaborative Soullink &amp; Nuzlocke Tracker - built for streamers, friend groups, and challenge runners.</b>
</p>

<p align="center">
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/releases"><img src="https://img.shields.io/github/v/release/joos-too/pokemon-soullink-tracker?style=for-the-badge&color=blue" alt="Release" /></a>&nbsp;
  <img src="https://status.freakmedialp.de/api/badge/32/uptime?style=for-the-badge" alt="Uptime" />&nbsp;
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/issues"><img src="https://img.shields.io/github/issues/joos-too/pokemon-soullink-tracker?style=for-the-badge" alt="Issues" /></a>&nbsp;
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/stargazers"><img src="https://img.shields.io/github/stars/joos-too/pokemon-soullink-tracker?style=for-the-badge&color=f5c542" alt="Stars" /></a>&nbsp;
  <a href="https://github.com/joos-too/pokemon-soullink-tracker/graphs/contributors"><img src="https://img.shields.io/github/contributors/joos-too/pokemon-soullink-tracker?style=for-the-badge" alt="Contributors" /></a>&nbsp;
</p>

<p align="center">
  <img src="public/screenshots/showcase-dark.png" alt="Tracker Showcase - Dark Mode" height="300" />
  &nbsp;
  <img src="public/screenshots/overview-dark.png" alt="Tracker Overview - Dark Mode" height="300" />
</p>

---

## What is Soullink Tracker?

Soullink Tracker is an open-source web app for managing Pokémon **Soullink** and **Nuzlocke** runs. You can track your links/catches, cleared routes, progression, and items. It also syncs the tracker state in real time between all players, so everyone always sees the same state of team, box, progression... - no spreadsheets, no Discord copy-pasting or constant streaming.

Whether you're streaming a duo Soullink, running a solo Nuzlocke, or coordinating a trio challenge with friends, this tracker helps you manage your entire run.

---

## ✨ Features

- **Pokémon linking** - Directly pair Pokémon links and add the catch area
- **Progression tracking** - Badges/Gyms, Rival battles, and Elite Four, all with provided level caps
- **Evolution tracking** - Evolve linked Pokémon and keep links in sync
- **Item tracking** - Track your Fossils, Evolution stones, Mega stones, and other items. Reviving a fossil automatically creates a new link
- **Version-awareness** - Pokémon, Routes, and Items are filtered and autocompleted by the game version you're playing
- **Team management** - Filter and sort your links by type to find the best links for your active team
- **Solo, Duo & Trio** - The Tracker supports Solo-Nuzlocking, up to Trio-Soullink
- **Custom rulesets** - Use built-in presets or create and save your own rules
- **Public / read-only mode** - Share your tracker with stream viewers or guests, enabling them to inspect your progress
- **Real-time collaboration** - All players see changes instantly, making it very easy to coordinate runs and build your team
- **Localization** - Full English and German support

---

## 🎮 Supported Versions

The tracker provides **pre-filled level caps and rival battle data** for all mainline games up to Generation 6. Newer generations introduced non-gym progression (trials, challenges), so they aren't included as presets - but you can still enable all Pokémon and Items from newer generations in Custom Trackers.

<details>
<summary><b>Version overview</b></summary>

| Generation | Versions                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gen 1**  | ![Red / Blue](public/screenshots/badges/gen1_rb.png) ![Yellow](public/screenshots/badges/gen1_y.png)                                                              |
| **Gen 2**  | ![Gold / Silver](public/screenshots/badges/gen2_gs.png) ![Crystal](public/screenshots/badges/gen2_c.png)                                                          |
| **Gen 3**  | ![Ruby / Sapphire](public/screenshots/badges/gen3_rusa.png) ![Emerald](public/screenshots/badges/gen3_em.png) ![FR / LG](public/screenshots/badges/gen3_frlg.png) |
| **Gen 4**  | ![Diamond / Pearl](public/screenshots/badges/gen4_dp.png) ![Platinum](public/screenshots/badges/gen4_pt.png) ![HG / SS](public/screenshots/badges/gen4_hgss.png)  |
| **Gen 5**  | ![Black / White](public/screenshots/badges/gen5_bw.png) ![Black 2 / White 2](public/screenshots/badges/gen5_b2w2.png)                                             |
| **Gen 6**  | ![X / Y](public/screenshots/badges/gen6_xy.png) ![OR / AS](public/screenshots/badges/gen6_oras.png)                                                               |
| **Gen 7+** | Custom Trackers                                                                                                                                                   |

</details>

### Custom Trackers

All Pokémon and items from Gen 7+ are available when you select **Custom Tracker** - perfect for ROM hacks, or fan games, which add newer Pokémon to older game version.

---

## 🛠 Tech Stack

| Layer        | Technology                                           |
| ------------ | ---------------------------------------------------- |
| **Frontend** | React 19 · TypeScript · Tailwind CSS                 |
| **Build**    | Vite                                                 |
| **Backend**  | Firebase Authentication · Firebase Realtime Database |
| **Data**     | PokéAPI · PokéWiki                                   |

---

## 🚀 Getting Started

```bash
git clone https://github.com/joos-too/pokemon-soullink-tracker.git
cd pokemon-soullink-tracker
npm install
cp .env.example .env
npm run emulators   # terminal 1
npm run dev          # terminal 2
```

For the full setup guide, environment config, deployment instructions, and architecture details, check out the **[Contributing Guide](CONTRIBUTING.md)**.

---

## 🤝 Contributing

Contributions are welcome! Check out the **[Contributing Guide](CONTRIBUTING.md)** for everything you need - local setup, architecture overview, coding conventions, and how to submit a pull request.

_Have an idea or found a bug? [Open an issue!](https://github.com/joos-too/pokemon-soullink-tracker/issues)_

---

## 📝 Credits & Acknowledgments

| Resource                                              | Usage                                          |
| ----------------------------------------------------- | ---------------------------------------------- |
| [PokéAPI](https://pokeapi.co/)                        | Pokémon data (types, evolution chains/methods) |
| [PokéWiki](https://www.pokewiki.de/)                  | Item version info, Item & rival sprites        |
| [PokeAPI Sprites](https://github.com/PokeAPI/sprites) | Pokémon & badge sprites                        |

---

<p align="center">
  <sub>Pokémon and all related names are trademarks of Nintendo / Creatures Inc. / GAME FREAK Inc.<br>This project is a fan-made tool and is not affiliated with or endorsed by any of these companies.</sub>
</p>
