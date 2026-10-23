# Friction log: Mystery Night, Build, Ship, Shape Amazon Developer Hackathon

Built Oct 20 to 23, 2026 for the Alexa+ track (simulated web experience) and the Open Source mini-challenge. Each entry: the task, the steps, expected against actual, severity, the workaround, and one suggestion.

## 1. What should a simulated Alexa+ entry look like?

- **Task:** build the Alexa+ track entry as a simulated web experience.
- **Steps:** read the track rules and the Alexa+ resources; looked for a sample or a short spec of a simulated entry.
- **Expected:** a reference showing what the simulation should imitate from the device experience.
- **Actual:** the rules allow the simulated path (and exempt it from the code-hook check), but I found no published pattern, so I designed my own mic control and an "Alexa+ simulation" panel that says what is simulated.
- **Severity:** Medium.
- **Workaround:** the header panel explains the simulation to the player; the host speaks every line and the table can ask by voice or by typing.
- **Suggestion:** publish one page, "what a simulated Alexa+ entry should show", with a sample. It saves every entrant the guesswork and makes entries easier to compare.

## 2. A voice for the host

- **Task:** give Inspector Hartley a consistent spoken voice.
- **Steps:** used the browser's `speechSynthesis`.
- **Expected:** one host voice across machines.
- **Actual:** a different voice on every browser and computer, and some sound flat. For a host-led game the voice is most of the experience.
- **Severity:** Medium.
- **Workaround:** every line also shows on screen, and a mute switch sits in the header panel.
- **Suggestion:** a rate-limited sandbox text-to-speech endpoint with the Alexa+ voice for simulated entries.

## 3. Listening in the browser

- **Task:** let the table question the Inspector out loud.
- **Steps:** used the Web Speech API's `SpeechRecognition`.
- **Expected:** works in the major browsers.
- **Actual:** works in Chromium browsers in practice; Safari and iOS have no usable recognition.
- **Severity:** Low.
- **Workaround:** the mic button renders only where recognition exists, so there is never a dead control; typing always works.
- **Suggestion:** document the input fallback the simulated track expects, so every entry handles it the same way.

## 4. A host who speaks first

- **Task:** a game host that speaks unprompted when the round clock runs out and when new evidence arrives.
- **Steps:** read the MCP route for Alexa+ to plan the device version.
- **Expected:** a way for an experience to speak on its own schedule.
- **Actual:** from my reading, the server answers when asked. I did not build the device path in this window, so this is a reading, not a test.
- **Severity:** High for games and timed experiences.
- **Workaround:** on the web, the page runs the clock and pushes the evidence.
- **Suggestion:** a timer or proactive-speech primitive for Alexa+ experiences. It turns party games from a web demo into a real device experience.

## 5. Short spoken replies from the model

- **Task:** two or three sentence in-character answers from Claude.
- **Steps:** capped replies at 200 tokens with thinking on.
- **Expected:** a short spoken reply every time.
- **Actual:** thinking could spend the budget before the first spoken word.
- **Severity:** Medium.
- **Workaround:** thinking only between tools for this call, so the whole budget is the spoken line; the SDK's server-side fallback handles a refusal in one line of config.
- **Suggestion:** for anyone building voice hosts: size the reply budget for the spoken line, not the reasoning.

## 6. Judging access and API cost

- **Task:** keep the entry playable for free through judging.
- **Steps:** read the rule on free test access.
- **Expected:** guidance on whether a degraded mode is acceptable if a paid API key lapses.
- **Actual:** not stated.
- **Severity:** Low.
- **Workaround:** the server answers from the Inspector's in-character notes when no key is set or a call fails, so the game always plays.
- **Suggestion:** say in the rules whether a visibly degraded mode is acceptable, or whether the full path must stay live for the whole judging window.
