# Mystery Night

An AI-hosted murder mystery party for the living room. The people at the table play the suspects. The Inspector deals the secret roles, runs the clock, hands out evidence, takes the table's questions out loud, and runs the reveal.

Built for the Build, Ship, Shape: Amazon Developer Hackathon (Alexa+ track, simulated experience, plus the Open Source mini-challenge). Case one, **Death at the Chili Cook-Off**, is a 15-minute, 3 to 4 player taste of the full game.

## What it is

One shared screen (a TV, a laptop on the counter, a phone passed around) and a spoken host.

1. **Lobby.** Type the players' names. The case briefing is on screen for the whole table.
2. **Pass and peek.** The phone goes around. Each player sees their own role, their secret, their lie and their goal, then hides it.
3. **The scene.** Inspector Hartley opens the case out loud and puts the first piece of evidence on the table.
4. **Round one (5 min).** The table questions each other. Anyone can ask the Inspector a question, by typing or by voice. He knows the scene, not the answer sheet, and he never names the killer.
5. **New evidence, round two (4 min).** The timeline firms up. The questions get sharper.
6. **The accusation.** On three, everyone points. The table locks in one name.
7. **The reveal.** The Inspector tells it the way it happened, then every secret comes out.

Roles are shuffled every game, so the same four people can play the case more than once.

## The Alexa+ simulation

The Alexa+ track accepts a simulated web experience, and that is what this is: the browser's speech synthesis is the Inspector's voice, and the mic control in the rounds uses the browser's speech recognition so the table can ask him out loud. The panel behind the mic in the header says exactly this to the player. Nothing here is an Amazon product and no Alexa device is required.

## The Inspector route

`api/inspector.js` is one Vercel serverless function. `POST /api/inspector` with `{ "question": "...", "round": 1 }` returns `{ "text": "...", "source": "claude" | "inspector-notes" }`.

- The case facts and the Inspector's rules live in the server-side prompt, so the browser never holds the answer sheet.
- It calls the Claude API with the official `@anthropic-ai/sdk`, model `claude-sonnet-5-5`, 200 tokens max, in character, two or three sentences.
- With no `ANTHROPIC_API_KEY` set, or when the call fails, it answers from the Inspector's own case notes (in-character lines keyed to what the table asked), so the game always runs.
- Questions are capped at 300 characters and 20 per minute per address.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3077. Put a key in `.env` (copy `.env.example`) and run `npm run dev` to hear Claude as the Inspector; without one the Inspector answers from his notes.

On Vercel: import the repo, add `ANTHROPIC_API_KEY` as a production environment variable, deploy. `public/` is the site, `api/` is the function. No build step.

`npm run screens` captures every screen at 1440 and 375 with headless Chrome into `screens/` (the build-report pass).

## Design

Values and logged exceptions are in `DESIGN.md`. Build and design rules come from Framework Studio's master rule files (pointer in `GLOBAL-BUILD-RULES.md`).

## Cases

Case one is fictional, as every case will be. Mystery Night will never use modern true crime.

## License

MIT. See `LICENSE`.
