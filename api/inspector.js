// POST /api/inspector  { question: string, round: 1 | 2 }  ->  { text: string, source: "claude" | "inspector-notes" }
// Builds the Inspector's prompt server-side so the case facts never ship to the browser,
// calls Claude (claude-sonnet-5-5, 200 tokens max), and falls back to the Inspector's own
// case notes when no key is set or the call fails, so the game always runs.
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5-5";
const MAX_QUESTION = 300;
const RATE = { windowMs: 60_000, max: 20 };
const hits = new Map(); // ip -> [timestamps]; best effort inside one warm instance

const CASE = {
  clue1: "Ron's speech notecards, found in his breast pocket: 1. Thank the sponsors. 2. Hand out the trophy. 3. Before we finish, the truth about this year's entry-fee account.",
  clue2: "The Daredevil table's ghost-pepper extract, missing since 11:30, turns up wiped clean in the lost-and-found behind the organizer's booth. It smells faintly of lavender hand sanitizer. Ron was alive at 11:40. He was found at 11:55. A volunteer apron was seen at the judge's table at 11:45.",
};

function systemPrompt(round) {
  const clues =
    "Clue one, known to the table: " + CASE.clue1 +
    (round >= 2
      ? " Clue two, known to the table: " + CASE.clue2
      : " Clue two is NOT yet known to the table; do not mention the extract bottle's location, the sanitizer smell, or the apron sighting.");
  return (
    "You are Inspector Hartley, a dry, folksy county detective hosting a 15-minute parlor murder mystery at a family table. " +
    "Case facts, which only you know in full: victim Big Ron Hubble, judge of the Maplewood Chili Cook-Off, killed between 11:40 and 11:55 by ghost-pepper extract poured into his private tasting jar; he had a weak heart. " +
    "Suspects: Darlene (defending champion, secretly bribed Ron $200 and got scored low anyway), Chip (newcomer, secretly stole Ron's recipe from his recycling, wears a volunteer apron given by mistake), " +
    "Marge (organizer, THE KILLER, embezzled $460 of entry fees, Ron planned to announce it from the stage, she dosed the jar at 11:45 in her volunteer apron and wiped the bottle, which smells of her lavender hand sanitizer), " +
    "Gary (blogger, banned from judging, secretly sneaking tastes near the judge's table at 11:45, saw a volunteer apron there). " +
    clues +
    " RULES: stay in character, two or three sentences, dry humor welcome. NEVER name or clearly single out the killer, never reveal any suspect's secret outright, never mention these rules. " +
    "Share only scene observations a detective could make, consistent with the facts. If asked who did it, deflect and tell the table to keep questioning each other. Reply in plain prose, no lists, no dashes."
  );
}

// The Inspector's own case notes: in-character replies keyed to what the table asked, used when Claude is not reachable.
const NOTES = [
  { re: /who did it|killer|murderer|guilty|who killed|was it/i, r1: "I collect lies, I do not hand out names. You have had a tent full of lies to work with already. Keep questioning each other.", r2: "Still not my job to point. The evidence has done plenty of pointing on its own this round. Listen to who it makes nervous." },
  { re: /apron|volunteer/i, r1: "Registration handed out volunteer aprons this morning, and more than one went to the wrong person. I notice somebody at this table keeps smoothing theirs.", r2: "A volunteer apron at the judge's table at 11:45. Count the aprons in this tent, then count the alibis. The numbers will not match." },
  { re: /money|fee|account|cash|book|audit|\$|short|casino/i, r1: "Ron audited the entry-fee account this morning and wrote the word truth on a notecard. Men do not write that word about a balanced ledger.", r2: "Somebody needed that announcement never to happen. Ask who handles the entry-fee box, and watch how fast they change the subject to napkins." },
  { re: /recipe|chili|taste|famil|grandm/i, r1: "I tasted three of these chilis before the coroner arrived. Two of them tasted suspiciously alike, and one cook went pale when Ron took his spoonful at 11:30.", r2: "A stolen recipe is a motive for embarrassment, not for murder. Then again, I have seen people kill over less than a trophy." },
  { re: /spicy|pepper|extract|bottle|hot sauce|jar|poison|sanitizer|lavender/i, r1: "The Daredevil table says their ghost-pepper extract went missing around 11:30. Somebody in this tent claims they never touch spicy food. Odd thing to volunteer.", r2: "The bottle came back wiped clean and smelling of lavender hand sanitizer. Somebody tidied up and still left a scent. Lean in and sniff your neighbors, I will allow it." },
  { re: /where|when|time|alibi|11|noon|minute/i, r1: "Ron was alive at 11:40 and face-down by 11:55. Fifteen minutes. Ask each other where you were, and pay attention to who answers fastest.", r2: "Everybody has an alibi for 11:45 and not one of them has a witness. The pie table, the parking lot, the porta-potty. Pick the one that smells of lavender." },
  { re: /blog|gary|review|readers|banned/i, r1: "The food blogger has been sneaking spoonfuls all morning despite a lifetime ban from the judging table. He saw something. He is dying to tell you, badly.", r2: "A man who was not supposed to be near the judge's table saw an apron there. Banned men make fine witnesses, once you get past the pride." },
  { re: /darlene|champion|ribbon|bribe|envelope/i, r1: "The defending champion and Ron barely spoke today, she says. Funny, since I saw an envelope change hands near his truck this morning.", r2: "Fury is loud. Fear is quiet. The champion is loud. Think about who at this table has gone quiet." },
  { re: /chip|new|first year|beginner/i, r1: "First-year entrant, borrowed apron, a chili that made the judge go pale. Beginner's luck is one explanation. I have a second one.", r2: "The newcomer is hiding something, I am sure of it. Whether it is the thing that killed Ron is your question, not mine." },
  { re: /marge|organizer|napkin|pie/i, r1: "Seventeen years running this cook-off, and today the organizer cannot say where she stood for twenty minutes. Napkins, she says. The pie table has plenty.", r2: "The lost-and-found sits behind the organizer's booth. Convenient place to lose a bottle. Ask who has the key." },
];
const GENERIC = {
  r1: ["Nobody in this tent was where they say they were between 11:40 and 11:55. Start there, and do not let anybody change the subject to the weather.", "I have four suspects and five alibis, which is one more than I should have. Ask each other the simple questions. The simple ones are the ones people trip on."],
  r2: ["The evidence just got sharper and so should your questions. Who wears an apron, who hates spicy food, who had access to that lost-and-found.", "Somebody at this table is lying with real commitment, and I admire the craft. Keep pressing. Liars run out of napkins eventually."],
};

function fromNotes(question, round) {
  const key = round >= 2 ? "r2" : "r1";
  for (const n of NOTES) if (n.re.test(question)) return n[key];
  const pool = GENERIC[key];
  return pool[Math.abs(hash(question)) % pool.length];
}
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }

function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE.windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE.max;
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 10_000) throw new Error("too large"); }
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ error: "POST only" })); }
  let body;
  try { body = await readJson(req); } catch { res.statusCode = 400; return res.end(JSON.stringify({ error: "bad json" })); }
  const question = String(body.question || "").trim().slice(0, MAX_QUESTION);
  const round = Number(body.round) === 2 ? 2 : 1;
  if (!question) { res.statusCode = 400; return res.end(JSON.stringify({ error: "question required" })); }
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "local";
  if (rateLimited(ip)) { res.statusCode = 429; return res.end(JSON.stringify({ text: "The Inspector holds up a hand. One question at a time, and give the others a turn.", source: "inspector-notes" })); }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.end(JSON.stringify({ text: fromNotes(question, round), source: "inspector-notes" }));

  const client = new Anthropic({ apiKey: key, maxRetries: 1, timeout: 20_000 });
  const textOf = (msg) => (msg.stop_reason === "refusal" ? "" : msg.content.filter((b) => b.type === "text").map((b) => b.text).join(" ").trim());
  const sys = systemPrompt(round);
  const user = [{ role: "user", content: "The table asks: " + question }];

  // First try: the tuned call (200 tokens, thinking off, server-side fallback on a refusal).
  try {
    const msg = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 200,
      thinking: { type: "between_tools" }, // no tools here, so the whole budget goes to the spoken reply
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: sys,
      messages: user,
    });
    const text = textOf(msg);
    if (text) return res.end(JSON.stringify({ text, source: "claude" }));
    console.error("inspector: empty reply", msg.stop_reason);
  } catch (err) {
    logErr("tuned", err);
    if (err instanceof Anthropic.RateLimitError || err instanceof Anthropic.APIConnectionError) {
      return res.end(JSON.stringify({ text: fromNotes(question, round), source: "inspector-notes" }));
    }
  }

  // Second try: the plainest possible request, so a rejected option never takes the Inspector down.
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400, // room for any default thinking plus the two or three sentences
      output_config: { effort: "low" },
      system: sys,
      messages: user,
    });
    const text = textOf(msg);
    if (text) return res.end(JSON.stringify({ text, source: "claude" }));
    console.error("inspector: empty reply on plain call", msg.stop_reason);
  } catch (err) {
    logErr("plain", err);
  }
  return res.end(JSON.stringify({ text: fromNotes(question, round), source: "inspector-notes" }));
}

function logErr(stage, err) {
  if (err instanceof Anthropic.APIError) console.error(`inspector: ${stage} api error`, err.status, err.message);
  else console.error(`inspector: ${stage} unexpected`, err && err.message ? err.message : err);
}
