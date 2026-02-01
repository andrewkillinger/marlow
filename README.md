# Marlow's Lemonade Stand

A fun mobile-first clicker/idle game made with Phaser 3, designed for 10-year-old Marlow to enjoy on iPhone Safari.

## Play Now

**Live Game:** https://andrewkillinger.github.io/marlow/

### Install as App (iOS)
1. Open the game URL in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Enjoy offline play!

## Features

- **Mobile-first design** - Optimized for portrait mode on iPhone
- **Big tap targets** - Easy to play with fingers
- **Colorful pixel art** - Cute evolving lemonade stand
- **Offline play** - Works without internet after first load
- **Auto-save** - Progress saved to localStorage
- **Visual polish** - Parallax hills, animated sun rays, ambient particles, steam effects
- **Tap combos** - Chain rapid taps for bonus multipliers
- **Daily challenges** - 3 new challenges every day (easy, medium, hard)
- **Play streak** - Consecutive daily play earns growing bonuses
- **Flavor boosters** - Temporary power-ups with strategic cooldowns
- **Prestige system** - "Go on Vacation" to reset and earn permanent star multipliers

---

## GAME DESIGN

### Core Gameplay

Tap the lemonade stand to sell lemonade and earn money! Use your earnings to buy upgrades that increase your income and automate your business.

### Visual Effects

The game features dynamic procedural visuals — no external image assets:

- **Parallax background** — Multi-layer sky gradient, animated hills, and drifting clouds
- **Sun rays** — Slowly rotating light beams behind the scene
- **Ambient particles** — Floating leaves and sparkles around the stand
- **Steam effects** — Rising steam from the lemonade stand
- **Tap feedback** — Ripple effects and bouncing stand on each tap
- **Combo display** — Color-shifting combo counter with pulse animations

### Progression System

#### Stand Evolution (10 Levels)
Your lemonade stand visually evolves as you earn more money:

| Level | Stand Name | Money Required |
|-------|------------|----------------|
| 1 | Cardboard Box Stand | $0 |
| 2 | Wooden Crate Stand | $50 |
| 3 | Small Table Stand | $200 |
| 4 | Decorated Stand | $500 |
| 5 | Professional Booth | $1,500 |
| 6 | Fancy Kiosk | $5,000 |
| 7 | Mini Shop | $15,000 |
| 8 | Lemonade Cafe | $50,000 |
| 9 | Lemonade Empire HQ | $150,000 |
| 10 | Marlow's Lemonade Palace | $500,000 |

### Upgrades

#### Stand Upgrades
- **Better Lemons** - Increase tap value
- **Faster Squeezing** - More money per tap
- **Bigger Cups** - Price multiplier boost

#### Marketing
- **Pretty Sign** - Attract more customers
- **Violet's Art Stand** - Sister decorates the stand!
- **Volleyball Tournament Ad** - Advertise at games

#### Helpers (Auto-Income)
- **Hire Helper** - Earn money automatically
- **3D Printed Robot** - Daddy's printer creation!
- **Poppy the Greeter** - Golden retriever welcomes customers
- **Winnie the Guard Dog** - Protects lemons from squirrels
- **Basketball Court Cooler** - Sells at basketball games
- **Mission Estancia Location** - Second stand location!

#### Special
- **Golden Lemon** - Global income multiplier
- **Mommy's Secret Recipe** - Family recipe boosts sales
- **Labubu Lucky Charm** - Increases lucky bonus chance

### Quests

Complete quests to earn bonus money:

- First Sale! - Sell your first lemonade (+$5)
- Getting Started - Sell 10 lemonades (+$15)
- Popular Stand - Sell 100 lemonades (+$50)
- Lemonade Master - Sell 1,000 lemonades (+$200)
- First Hundred - Earn $100 total (+$25)
- Big Money - Earn $1,000 total (+$100)
- Team Building - Hire your first helper (+$50)
- Family Business - Get Violet, Poppy & Winnie helping (+$250)
- Lucky Day - Get 5 lucky bonuses (+$75)
- And more!

### Tap Combo System

Tap rapidly (within 2 seconds between taps) to build a combo chain:

- Each combo step adds **+2% bonus** to tap income
- Maximum combo bonus is **+50%** at 25x combo
- Combo counter displays with color shifts: amber -> orange (10x) -> red (20x)
- Lucky hits during combos trigger a camera flash and fanfare

### Daily Challenges

Three new challenges appear every day, one from each difficulty tier:

- **Easy** - Simple goals like "Tap 50 times" (~$15-25 reward)
- **Medium** - Moderate goals like "Earn $100 today" (~$40-60 reward)
- **Hard** - Ambitious goals like "Tap 300 times" (~$90-120 reward)
- Complete all 3 for an extra **$75 bonus**
- View challenges in the Quest tab under "Daily"

### Play Streak

Playing on consecutive days builds a streak:

- Each day adds **+1% income multiplier** (up to +30% at 30 days)
- Login bonus money grows with streak length
- Streak badge displayed in the top-left corner
- Missing a day resets the streak to 1

### Flavor Boosters

Temporary power-ups with a 5-minute cooldown between uses:

| Booster | Effect | Duration | Unlocks At |
|---------|--------|----------|------------|
| Strawberry Lemonade | 2x tap value | 60s | $100 earned |
| Blueberry Blast | 2x auto income | 60s | $1,000 earned |
| Mango Madness | 3x ALL income | 30s | $10,000 earned |

Activate boosters via the purple "MIX" button during gameplay.

### Prestige System — Lemonade Stars

Once you've earned enough, "Go on Vacation" from Settings to prestige:

- Resets money, upgrades, and quests
- Keeps streak, settings, and earned **Lemonade Stars**
- Each star provides a permanent **+10% income multiplier**
- Stars accumulate across prestiges

| Total Earned | Stars Earned |
|-------------|-------------|
| $10,000 | 1 |
| $50,000 | 2 |
| $200,000 | 3 |
| $500,000 | 5 |
| $1,000,000 | 8 |
| $5,000,000 | 13 |
| $10,000,000 | 21 |

### Random Events

Events happen randomly during gameplay:

- **Hot Day!** (2x earnings for 30s)
- **Parade Day!** (3x earnings for 20s)
- **Rainy Day** (0.5x earnings for 20s)
- **Lemon Sale!** (Instant $10 bonus)
- **Famous Visitor!** (5x earnings for 15s)
- **Dog Show Nearby!** (2.5x earnings with Poppy)
- **Sports Tournament!** (4x earnings for 30s)
- **Labubu Craze!** (Instant $50 with Labubu charm)

### Collections

Randomly collect items while playing:

**Lemon Collection**
- Regular Lemon (common)
- Meyer Lemon (uncommon)
- Eureka Lemon (uncommon)
- Pink Lemon (rare)
- Golden Lemon (legendary)

**Cup Collection**
- Paper Cup, Fancy Plastic Cup, Glass Cup, Trophy Cup

**Decoration Collection**
- Yellow Balloon, Colorful Banner, Fairy Lights, Labubu Statue

---

## EASTER EGGS

The game includes special themed content for Marlow's family and interests:

### Family Members
- **Marlow** - The main character running the stand
- **Violet** - Sister who decorates the stand with her art
- **Mommy** - Provides a secret family lemonade recipe
- **Daddy** - Made a 3D printed robot helper

### Pets
- **Poppy** - Golden retriever who greets customers
- **Winnie** - Guard dog who protects the lemons

### Interests
- **Labubus** - Lucky charm decoration
- **Volleyball** - Tournament advertising upgrade
- **Basketball** - Court cooler expansion
- **3D Printers** - Robot helper upgrade
- **Mission Estancia** - Second stand location expansion

### Secret Easter Eggs
- Tap the sun 5 times on the title screen for a surprise!
- Tap both top corners (3 times each) during gameplay for a secret bonus!

---

## Development

### Prerequisites
- Node.js 18+
- npm

### Setup
```bash
npm install
```

### Run Tests
```bash
npm test
```

### Local Development
```bash
npx serve .
```
Then open http://localhost:3000 in your browser.

### Generate Icons
```bash
npm run generate-icons
```

### Project Structure
```
marlow/
├── index.html           # Main HTML file
├── src/
│   ├── economy.js       # Game economy logic (testable)
│   └── game.js          # Phaser 3 game code
├── tests/
│   └── economy.test.js  # Economy unit tests
├── icons/               # PWA icons
├── scripts/
│   └── generate-icons.js
├── service-worker.js    # PWA offline support
├── manifest.webmanifest # PWA manifest
├── package.json
└── vitest.config.js
```

### Technologies
- **Phaser 3** - Game framework
- **Web Audio API** - Sound effects
- **PWA** - Offline support & installable
- **Vitest** - Testing framework
- **GitHub Actions** - CI/CD deployment

---

## Backup Reference

Original repository content preserved at:
- Tag: `backup-pre-lemonade`
- Commit: `21217e8014f1744c4973eac0ed40d1a3630053c6`

---

## License

MIT - Made with love for Marlow
