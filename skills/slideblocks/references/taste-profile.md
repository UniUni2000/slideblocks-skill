# Taste Profile

Each user has one small taste profile. It records how they like presentations to look and read, distilled from their own feedback and choices, so the next Deck starts closer to their taste. Use it to decide the visual direction, to show cold-start samples, and to report what was learned at delivery. Keep it short: it is read at the start of every Deck.

## Read the profile first

Read the taste profile before choosing a visual direction.

Run the client's taste command before planning and use the directory and profile it prints; read only taste.md, taste-history.md and .taste-last.md there. The command is `<slideblocks-client> taste` (add `--json` for a machine-readable answer); it resolves the directory the same way the client stores its own configuration.

- Resolve the taste directory from SLIDEBLOCKS_CONFIG_DIR, then $XDG_CONFIG_HOME/slideblocks, then ~/.config/slideblocks. It holds `taste.md` (the profile), `taste-history.md` (the change log) and `.taste-last.md` (the last version this workflow wrote).
- Also read the project fallback `.slideblocks/taste.md` when it exists. The taste directory's copy wins when both exist.
- If `.slideblocks/taste-signals.md` holds signals after `taste.distilledThrough` (an earlier session ended before delivery), distil them first, as described under "Distil at delivery".
- Decide the scenario: a short name for the kind of presentation, such as 学术报告, 技术分享, 工作汇报, 产品发布, 融资路演 or 课堂. Reuse a name that already appears in the profile whenever it fits; a request worded as 科研进展介绍 is still 学术报告.
- Set `schemaVersion` to 2 in `.slideblocks/workflow-state.json` and record the result there as a `taste` object, and in `.slideblocks/page-plan.md` as a `### Taste applied` subsection at the end of `## Visual direction`:

```json
"taste": {
  "profile": "/Users/name/.config/slideblocks/taste.md",
  "scenario": "学术报告",
  "samples": "skipped:profile covers this scenario",
  "choice": null,
  "distilledThrough": null
}
```

- `profile` is the profile path, or null when none exists. `samples` is `shown` or `skipped:<reason>`. `choice` is the chosen sample letter or null. `distilledThrough` is the last distilled signal ID, such as `S004`, or null.
- `### Taste applied` lists the profile path and its updated date (or 无), the scenario, the direction used, every applied taste copied verbatim, and any taste not applied with the reason.

## When the profile covers the scenario

When the profile's 各场景的方向 has a line for this scenario, do not show samples. Your first message for this Deck is the line the taste command prints for its scenario, word for word; repeat it in the delivery report of a one-shot run. Then continue without waiting. The line looks like this:

> 这次按你的口味做（学术报告）：白底学术；图注居中放在图下方；结尾页只留 Thank you 和 Questions。想改随时说。

## Cold-start samples

Show cold-start samples only for a new deck of three or more pages or a full visual redesign, when the profile has no direction for this scenario, the user has not set a style, and the user has not asked you to proceed without questions.

- The user has set a style when they name a look or brand ("用深色", "按我们模板"), supply a brand template to follow, or select a specific SlideBlocks design. Proceed without questions when they say 直接做, 不用问我 or the equivalent, or when this run cannot wait for a reply (for example a one-shot command-line run); then use direction A and record no taste from that choice.
- Never show samples for a page edit, a repair of an existing Deck, a narrative-only redesign or a source-faithful PowerPoint migration.
- The samples are the two grammar pages this workflow builds first anyway, with real content and real material; use the same two pages for a 3–4 page Deck. Choose sample pages whose surface differences are visible; never use a full-bleed image cover as a sample page. Prefer an opening page with a visible title and canvas plus the densest body page with text, a figure and its caption.
- Never print sample labels such as A, B or 样张 on the slides. Direction letters and descriptions belong on the sample sheet only.
- Offer two or three directions that differ only in surface: canvas, palette, type, page furniture, image treatment and motion.
  - A is the default: this skill's default direction, with every 全部 taste applied.
  - B comes from the user's material: brand colours, a supplied template, or the subject's own colour and character.
  - C is optional: a clearly different direction, offered only when the content supports it.
  - What a 全部 taste already fixes (for example 白底) stays fixed in every direction; directions differ only where the profile is silent.
- Build one set of page code and switch token sets; never build the pages three times. Label each direction with one plain line in the user's language, such as 「A 白底学术：衬线标题，学术蓝，细线」.
- Before showing anything, run the same layout checks as delivery on both pages in every direction: no overflow, no collisions, no missing assets. Screenshot each page at 1280×720 after fonts and media load.
- Fill `assets/taste/samples-sheet.html` from this skill into `.slideblocks/samples/index.html`, with the screenshots beside it in `.slideblocks/samples/`. Give the user its path, attach the images when the host can show them, and ask for one letter, for example 「回一个字母，或者「B，但背景换白」」.
- Write samples: "shown" and the blocked state only after the sample sheet exists. Then set `workflow-state.json` to `status: "blocked"`, `resumeFrom: "samples"`, with a blocker saying the user is choosing a direction, so a new session can resume.
- In a run that cannot wait for a reply, run long commands in the foreground and never end the turn on a background job. A one-shot run exits when its turn ends and takes background installs, servers and screenshots with it.
- Allow at most one extra round of samples. If the user rejects every direction, ask what is wrong, show one more round, and then follow their latest stated preference.
- After the choice, update workflow-state.json and page-plan.md before building more pages. Record `taste.choice`, leave the blocked state, repair `page-plan.md`'s visual direction and `### Taste applied`, then regenerate the recurring colour and type roles in `execution-lock.json`, then continue with the remaining pages. Keep the selected Registry Artifacts and adapt their surface. Delete the unchosen token sets. Log the choice and any comment as a signal; it enters the profile at delivery without waiting for a second occurrence.

## Same-kind pages

When the user gives taste feedback on one page, apply it to every page of the same role or layout in this Deck and name those pages in the reply, for example 「第 2、5、7 页也一起改了」. Feedback about one page's own content changes only that page.

## Taste signals

A taste signal is feedback about how the presentation looks or reads that would still hold for different content: canvas, palette, type, preferred text size, spacing and alignment habits, page furniture and navigation, the balance of text and imagery, caption and credit placement, bullet style, diagram treatment, motion and transitions, closing pages, and the voice of the copy. A sample choice with its comment is a signal. So is an explicit 「记住」 or 「以后都这样」.

When taste feedback is vague, name the concrete elements you think it means and ask before changing them. Ask in one sentence that lists your guesses, for example 「是指标题上方的彩色小标签、引号标题、『粗体词 — 解释』式的条目吗？」. After the user confirms, change each confirmed element on every same-kind page, log one signal per element, and keep the part of the quote that names the element.

Not signals: feedback about one page's own content (「加上 08 年的数据」), factual corrections, and silence (no reply is not approval). Quality defects are never tastes. Overlap, overflow, illegible text, broken notation and missing assets are fixed as defects.

Append every signal to `.slideblocks/taste-signals.md` as soon as it happens. Never rewrite earlier lines:

```markdown
- S001 · 2026-10-20 · P03 · 意见 ·「图注应该和图居中对齐」→ 图注居中
- S002 · 2026-10-20 · 看样 · 选了 B ·「B，但背景换白」
```

Record a taste only after it appears in two separate user messages or choices.

- One message or one choice is one occurrence, even when it names several pages.
- Repeating the same complaint about the same spot because the first fix failed is not a second occurrence.
- An inference of your own, without the user's words, is never an occurrence.
- A first occurrence goes to 再观察. A second occurrence, in this Deck or a later one, turns it into a taste with both evidence lines.
- Watch items are never applied. They wait in 再观察 until a second occurrence turns them into tastes. The taste command hides watch items; read 再观察 in `taste.md` only when distilling at delivery.
- A sample choice or an explicit request to remember is recorded without waiting for a second occurrence.

## Distil at delivery

Distil at every delivery, including a delivery after revisions:

1. Save the current profile as `.slideblocks/taste-before.md`.
2. Read `taste.md`, `.taste-last.md` and every signal after `taste.distilledThrough`.
3. Update `taste.md`, append to `taste-history.md`, write the delivery summary, and set `taste.distilledThrough` to the last signal ID.
4. Check the profile against the format rules below. If it fails, restore `.slideblocks/taste-before.md` and give the reason in the summary; delivery still proceeds. If it passes, copy `taste.md` to `.taste-last.md`.

When distilling many signals at once, list every candidate that appears twice or more before deciding. This matters most when seeding a profile from a long feedback history.

Re-read `taste.md` immediately before writing and merge, so a change made by another session is not lost. If the taste directory cannot be written (an Agent sandbox limited to the project, or the user declined), write `.slideblocks/taste.md` in the project instead and say in the summary how to move it.

## Check before delivery

Check each applied taste on the rendered pages, not in the plan. Measure what can be measured, such as how many lines a bullet wraps to, and inspect screenshots for the rest. Repair and rerender any page that misses a taste before writing 已应用 under `### Taste applied`.

## Conflicts

When the user asks for the opposite of a taste, follow the user for this Deck and log the statement in 再观察 marked 「和『…』相反」. A second opposite occurrence in the same scenario rewrites the taste and logs 以前 → 现在 in `taste-history.md`. Mention the exception in the summary, for example 「这次你要深色，和档案里『学术报告用白底』不一样，先当这套 deck 的例外。」

## The user's edits win

The user's edits win.

- While distilling, compare `taste.md` with `.taste-last.md` to find what the user changed or deleted, and log it in `taste-history.md` as 你改了 or 你删了.
- Never reword a sentence the user edited. Bring back a taste the user deleted only after two new occurrences after the deletion, and log the reason.
- When the user says 「这条别记」, do not record it; if it is already recorded, delete it and log 你说别记.

## Precedence

From highest to lowest:

1. The quality floor in `style-profiles.md` ("Separate quality from style")
2. This request's explicit instructions, including a SlideBlocks design the user selected
3. Brand material and templates the user supplied
4. The profile's direction and tastes for this scenario
5. The profile's 全部 tastes
6. A Registry design selected automatically
7. This skill's default direction

## Profile format: `taste.md`

Write the profile in the language the user speaks with the Agent. It must stay readable after hand edits:

```markdown
# 我的 PPT 口味

> SlideBlocks 从你的修改意见和选择里记下的口味。同一个意思出现两次以上才记；你可以直接改、直接删，AI 以你改的为准。

## 各场景的方向
- 学术报告：白底学术，衬线标题，学术蓝点缀（2026-10-20 看样时选的 · M87 deck）

## 口味
### 图注居中放在图的正下方，尽量一行。
- 场景：全部
- 依据：
  - 2026-10-20 · M87 deck P03 ·「图注应该和图居中对齐」
  - 2026-11-02 · 恒星形成 deck P05 ·「这个图注也居中」

## 再观察
- 2026-10-20 · 学术报告 · M87 deck P01 ·「上面的导航栏不要了」
```

- Each taste is one sentence of at most 60 characters that can be checked against a rendered slide. It sits on the `###` line. Count characters as Unicode code points. 「图注居中」 qualifies; 「要有学术感」 does not.
- Evidence needs at least two lines, each with the date, the Deck, the page when there is one, and the user's short quote. One line is enough when it is marked 「你写的」 (the user wrote the taste) or ends with 「（你说记住）」 (the user asked you to remember).
- 场景 is 全部 or one scenario name. Use 全部 only when the evidence spans two or more scenarios or the user says it applies everywhere. A missing 场景 means 全部.
- Keep at most 12 tastes and at most 10 watch items. When 再观察 is full, drop its oldest line. 各场景的方向 has one line per scenario.
- Tolerate hand edits: missing fields never break reading, and a deleted file means starting over.

## Change log: `taste-history.md`

Append one entry each time the profile changes. Never edit earlier entries:

```markdown
### 2026-11-02 · 恒星形成 deck
- 新增：图注居中放在图的正下方，尽量一行。
- 因为：「这个图注也居中」（P05），加上 10-20 M87 deck P03 那次
```

Actions: 新增, 改写, 合并, 挪进再观察, 挪出, 删除, 你改了, 你删了.

## Delivery summary

Add at most three lines to the delivery report, in the user's language:

> 记下了 1 条口味：图注居中放在图的正下方（你在第 3 页和第 7 页都这么改过）。
> 改了 1 条：学术报告的底色，白 → 浅绿白（你两次这么要求）。
> 口味档案在 ~/.config/slideblocks/taste.md，想改直接改。

With more than two changes, write the first two and then 「另有 N 条，见口味变化」. When nothing changed, write the single line 「口味档案没有变化」.

## Privacy

Never upload taste data through the client, the Catalog or any web request, and never write it into delivered files.
