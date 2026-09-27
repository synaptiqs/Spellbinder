# Spellbinder

A fantasy RPG where you cast spells by spelling words. A game first, learning is the byproduct.

An apprentice broke the words that hold the world together, and must mend them by climbing five mastery tiers across 30 level nodes (6 zones x 5 levels) before the old wizard wakes.

**Status:** revived from session archives, 2026-09-26. Core build is complete and syntax-verified; see Revival Plan below.

## Stack

- Phaser 3.60.0 (HTML5, Canvas + WebGL, via jsDelivr CDN)
- Vanilla ES modules, no build step
- PWA: manifest.json wired; service worker (`sw.js`) still to be written
- Optional backend: Firebase (auth + Firestore) via `firebase-config.js`

## Run it

```bash
npx serve .
```

ES modules require HTTP, so don't open index.html over `file://` (the page will warn you).

## Layout

```
index.html            entry point (manifest link, Phaser CDN, module bootstrap)
game.js               Phaser game config + scene registry
style.css             shell styles
manifest.json         PWA manifest
firebase-config.js    your Firebase web config (fill in before enabling online features)
firestore.rules       Firestore security rules
src/scenes/           Boot, Title, CharCreate, WorldMap, Battle, Results, Profile, Leaderboard, Dashboard
src/systems/          Word (319-word DB), Save, Progress, Firebase
src/data/             word lists: words-k3.js, words-4-8.js, words-9-12.js
docs/GameDesignDocument.md
```

## Revival Plan

1. **Push assets from the Windows PC** - ~200 binary images (6 backgrounds, 6 wizards, 6 enemies, 182 letter tiles, panels, logo, icons/) referenced by BootScene preload. They never left the original dev machine.
2. **Decision: unloseable campaign** - the recovered BattleScene has a defeat path (15 dmg per wrong letter, 100 HP). The later design direction was unloseable (mistakes cost accuracy stars only). Pick one and reconcile.
3. **Write `sw.js`** - offline support for the PWA, then a real device test (the old blocker was file:// access in the Chrome extension, moot once served over HTTP).
4. **Expand the word DB** - currently 319 words; the target was 800+.
5. **Wire Firebase** - fill in `firebase-config.js` with a real project, enable Google + anonymous auth, apply firestore.rules.
6. **Deploy** - final direction was S3 + CloudFront with Firebase backend. timeforspelling.com is registered and currently parked at Bluehost.

## Provenance

Reconstructed 2026-09-26 from the original build's session archives (file-history snapshots). All JS passes `node --check`. The one implemented battle mode, 319-word DB, and defeat-path battle rules are what shipped in the recovered build; the 10-mode roadmap and unloseable loop live in the design docs.
