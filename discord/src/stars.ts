// Star milestones: every 100th star on the repo gets one post in #milestones, with the way left to the goal.

import { send } from "./guild.ts";
import type { Env } from "./index.ts";

const STEP = 100;
const BAR = 20;
const KEY = "stars:milestone";

/** Posts the milestone the star count has reached, once: unstarring and starring again doesn't repeat it. */
export async function celebrate(env: Env, stars: number): Promise<void> {
  const milestone = Math.floor(stars / STEP) * STEP;
  const last = Number((await env.LINKS.get(KEY)) ?? 0);
  if (milestone <= last) return;
  // ponytail: KV isn't atomic, so two stars delivered at the same instant on a new milestone could post it twice.
  if (await send(env, env.MILESTONES_CHANNEL_ID, milestoneMessage(milestone, Number(env.STAR_GOAL), env.REPO))) {
    await env.LINKS.put(KEY, String(milestone));
    console.log("star milestone", { stars: milestone });
  }
}

const PITCH = "Codync: your coding agents, as teammates you can message. Free and open source.";

/** One-click posts about Codync on the usual social platforms, linking the repo. */
function shareLinks(url: string): string {
  const q = (params: Record<string, string>) => new URLSearchParams(params).toString().replaceAll("+", "%20");
  return [
    `[X](https://x.com/intent/post?${q({ text: PITCH, url })})`,
    `[Threads](https://www.threads.net/intent/post?${q({ text: `${PITCH} ${url}` })})`,
    `[Reddit](https://www.reddit.com/submit?${q({ url, title: PITCH })})`,
    `[LinkedIn](https://www.linkedin.com/sharing/share-offsite/?${q({ url })})`,
  ].join(" · ");
}

export function milestoneMessage(stars: number, goal: number, repo: string): string {
  const n = (x: number) => x.toLocaleString("en-US");
  const url = `https://github.com/${repo}`;
  const head = stars >= goal && stars - STEP < goal
    ? `🎉 **Codync hit ${n(stars)} stars on GitHub, goal reached!**`
    : `⭐ **Codync just hit ${n(stars)} stars on GitHub!**`;
  const filled = Math.round((stars / goal) * BAR);
  const progress = stars < goal ? `\n\`${"█".repeat(filled)}${"░".repeat(BAR - filled)}\` ${n(stars)} / ${n(goal)}` : "";
  const ask = stars < goal ? `Help us reach ${n(goal)}: tell people about Codync` : "Keep spreading the word";
  return `${head}${progress}\nThanks to everyone who starred [${repo}](${url}) 💛\n\n📣 ${ask} on ${shareLinks(url)}, or wherever you hang out.`;
}
