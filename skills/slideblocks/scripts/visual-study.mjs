import { createHash } from 'node:crypto';
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const reviewAxes = ['density', 'hierarchy', 'relationships', 'fidelity'];

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function saveJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
}

function section(path, heading) {
  const text = readFileSync(path, 'utf8');
  const marker = `## ${heading}\n`;
  const start = text.indexOf(marker);
  requireCondition(start >= 0, `Missing guidance section: ${heading}`);
  const end = text.indexOf('\n## ', start + marker.length);
  return text.slice(start, end < 0 ? undefined : end).trim();
}

function effectiveGuidance() {
  const design = join(skillRoot, 'references/design-principles.md');
  return [
    section(join(skillRoot, 'references/style-profiles.md'), 'House starting direction across tasks'),
    section(design, 'Derive form from the content'),
    section(design, 'Ground the direction in real context'),
    section(design, 'Keep composition studies separate from factual evidence'),
    section(design, 'Reason about typography'),
    section(design, 'Perform an aesthetic critique')
  ].join('\n\n');
}

function contextBrief(plan, references, placeholders) {
  return [
    `Audience and question\n${plan.brief}`,
    plan.taste ? `Applied owner preferences\n${plan.taste}` : '',
    `Content and source boundary\n${plan.content}`,
    'Reference roles: source images supply facts. Design and approved images calibrate visual expression, not factual claims. Rejected images show defects to avoid. Choose composition for the present content.',
    ...references.map((reference, index) => `Image ${index + 1} [${reference.role}]: ${reference.description}\n${reference.path}`),
    placeholders.length
      ? `Declared composition placeholders (visibly label these regions in the study; restore the originals in production)\n${placeholders.map(item => `- ${item.description}\n  Replace with: ${item.replaceWith}`).join('\n')}`
      : 'No evidence regions are declared as placeholders. Repainted factual imagery or geometry fails fidelity; declare a labeled placeholder in a new study if preservation is not possible.'
  ].filter(Boolean).join('\n\n');
}

const reviewCriteria = `Judge the visible result on four axes:
- density: identify the source-backed objects, comparisons, states, relationships and qualifications the audience can inspect together. Large pictures, repeated summaries and filled space alone do not demonstrate density.
- hierarchy: compare heading attention, body grouping, bullets, subordinate explanation and local labels with the professional reference. Decide whether the title earns its prominence; no fixed type size.
- relationships: follow each explanation to the exact visible feature; check reading order and both ends of comparisons. Ask what the presenter can point to.
- fidelity: check numbers, units, conditions, labels and truthful imagery. Declared, visibly labeled placeholders may pass placement only; they never approve factual image content or quantitative geometry. An undeclared repaint, unsupported caption or false relationship fails.
If the source has useful context absent from a sparse candidate, return to source selection or page planning, rather than merely enlarging its existing elements. Report the concrete missing relationship. Do not manufacture a defect in a page that already works.`;

function snapshotReference(reference, base) {
  requireCondition(['source', 'design', 'approved', 'rejected'].includes(reference.role), 'Unknown reference role');
  requireCondition(reference.description?.trim(), 'Each reference needs its purpose');
  const path = resolve(base, reference.path);
  const bytes = readFileSync(path);
  return { role: reference.role, description: reference.description, path, sha256: digest(bytes) };
}

function verifyReferences(references) {
  for (const reference of references) {
    requireCondition(digest(readFileSync(reference.path)) === reference.sha256, `Reference changed: ${reference.path}`);
  }
}

export function prepareStudy(planPath, runDirectory) {
  const plan = readJson(planPath);
  requireCondition(plan.author?.trim() && plan.brief?.trim(), 'Plan needs author and audience brief');
  requireCondition(plan.pageId?.match(/^[a-zA-Z0-9_-]+$/), 'pageId must be a safe file identifier');
  requireCondition(plan.content?.trim(), 'Plan needs source-backed content');
  requireCondition(Array.isArray(plan.variants) && plan.variants.length > 0, 'Plan needs a composition candidate');
  requireCondition(Array.isArray(plan.references), 'Plan needs references');
  const references = plan.references.map(reference => snapshotReference(reference, dirname(resolve(planPath))));
  requireCondition(references.some(reference => reference.role === 'source'), 'A factual source image is required');
  requireCondition(plan.placeholders === undefined || Array.isArray(plan.placeholders), 'placeholders must be an array');
  const placeholders = (plan.placeholders ?? []).map(item => {
    requireCondition(item.description?.trim() && typeof item.replaceWith === 'string', 'A placeholder needs description and replaceWith');
    const replaceWith = resolve(dirname(resolve(planPath)), item.replaceWith);
    requireCondition(references.some(reference => reference.role === 'source' && reference.path === replaceWith), 'A placeholder must name an original source reference');
    return { description: item.description, replaceWith };
  });
  const guidance = effectiveGuidance();
  const context = contextBrief(plan, references, placeholders);
  const names = new Set();
  const requests = plan.variants.map(variant => {
    requireCondition(variant.id?.match(/^[a-zA-Z0-9_-]+$/), 'Candidate id must be a safe file identifier');
    requireCondition(!names.has(variant.id), 'Candidate ids must be unique');
    names.add(variant.id);
    requireCondition(variant.prompt?.trim(), 'Candidate needs a design instruction');
    const prompt = [
      'Produce one complete 16:9 presentation mockup. Apply the following effective guidance to the bitmap itself.',
      guidance,
      context,
      `Composition candidate\n${variant.prompt}`
    ].filter(Boolean).join('\n\n');
    return {
      id: variant.id,
      prompt,
      referenced_image_paths: references.map(reference => reference.path),
      transparent_background: false,
      promptSha256: digest(prompt)
    };
  });
  mkdirSync(runDirectory);
  saveJson(join(runDirectory, 'plan.json'), plan);
  writeFileSync(join(runDirectory, 'effective-guidance.md'), guidance, { flag: 'wx' });
  const reviewerBrief = [
    `Review page ${plan.pageId}. Read the candidate receipts for their current image hashes.`,
    guidance, context,
    "Inspect the actual sources, professional reference and each recorded candidate at equal display width, without the author's design defense.",
    reviewCriteria,
    'Return JSON with reviewer, pageId, selected (candidate id or null), and candidates. Each candidate needs id, imageSha256 from its receipt, and the four axis objects, each with pass (boolean) and a concrete visible observation. A pass is composition-only and remains subject to unresolved lead findings.',
    ...requests.map(request => `Candidate ${request.id}\nImage: ${resolve(runDirectory, `${request.id}.png`)}\nReceipt: ${resolve(runDirectory, `${request.id}.receipt.json`)}`)
  ].join('\n\n');
  writeFileSync(join(runDirectory, 'reviewer-brief.md'), reviewerBrief, { flag: 'wx' });
  saveJson(join(runDirectory, 'requests.json'), requests);
  saveJson(join(runDirectory, 'inputs.json'), {
    references,
    placeholders,
    guidanceSha256: digest(guidance),
    reviewerBriefSha256: digest(reviewerBrief),
    planSha256: digest(readFileSync(join(runDirectory, 'plan.json'))),
    requestsSha256: digest(readFileSync(join(runDirectory, 'requests.json')))
  });
  return requests;
}

function loadRun(runDirectory) {
  const inputs = readJson(join(runDirectory, 'inputs.json'));
  verifyReferences(inputs.references);
  requireCondition(digest(readFileSync(join(runDirectory, 'plan.json'))) === inputs.planSha256, 'Page plan changed');
  requireCondition(digest(readFileSync(join(runDirectory, 'requests.json'))) === inputs.requestsSha256, 'Generation prompt changed');
  const guidance = readFileSync(join(runDirectory, 'effective-guidance.md'), 'utf8');
  requireCondition(digest(guidance) === inputs.guidanceSha256, 'Effective guidance changed');
  if (inputs.reviewerBriefSha256) {
    requireCondition(digest(readFileSync(join(runDirectory, 'reviewer-brief.md'))) === inputs.reviewerBriefSha256, 'Reviewer brief changed');
  }
  return { inputs, guidance, requests: readJson(join(runDirectory, 'requests.json')), plan: readJson(join(runDirectory, 'plan.json')) };
}

function candidateReceipt(runDirectory, request) {
  const receipt = readJson(join(runDirectory, `${request.id}.receipt.json`));
  requireCondition(receipt.id === request.id && resolve(receipt.path) === resolve(runDirectory, `${request.id}.png`), 'Candidate receipt path changed');
  requireCondition(digest(request.prompt) === receipt.promptSha256, 'Generation prompt changed');
  requireCondition(digest(readFileSync(receipt.path)) === receipt.imageSha256, 'Candidate changed after generation');
  return receipt;
}

export function holdCandidate(runDirectory, findingPath) {
  const { requests } = loadRun(runDirectory);
  const finding = readJson(findingPath);
  const request = requests.find(item => item.id === finding.id);
  requireCondition(request, 'Finding needs a recorded candidate id');
  const receipt = candidateReceipt(runDirectory, request);
  requireCondition(finding.reporter?.trim() && finding.observation?.trim(), 'Finding needs reporter and a concrete observation');
  requireCondition(finding.imageSha256 === receipt.imageSha256, 'Finding concerns a different image');
  saveJson(join(runDirectory, `${finding.id}.hold.json`), finding);
  return { ...finding, accepted: false, reason: 'This bitmap is held. Preserve this run and repair the finding in a new study.' };
}

export function recordCandidate(runDirectory, candidateId, imagePath) {
  const { requests } = loadRun(runDirectory);
  const request = requests.find(candidate => candidate.id === candidateId);
  requireCondition(request, `Unknown candidate: ${candidateId}`);
  requireCondition(digest(request.prompt) === request.promptSha256, 'Generation prompt changed');
  const image = readFileSync(imagePath);
  requireCondition(image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Record the original PNG returned by the image tool');
  const target = join(runDirectory, `${candidateId}.png`);
  copyFileSync(imagePath, target, constants.COPYFILE_EXCL);
  const receipt = { id: candidateId, path: resolve(target), imageSha256: digest(image), promptSha256: request.promptSha256 };
  saveJson(join(runDirectory, `${candidateId}.receipt.json`), receipt);
  return receipt;
}

export function checkReview(runDirectory, reviewPath) {
  const { plan, requests } = loadRun(runDirectory);
  const review = readJson(reviewPath);
  requireCondition(review.reviewer?.trim() && review.reviewer !== plan.author, 'Review needs a separate reviewer');
  requireCondition(review.pageId === plan.pageId, 'Review belongs to a different page');
  requireCondition(Array.isArray(review.candidates), 'Review must identify every generated candidate inspected');
  const recorded = requests.filter(request => existsSync(join(runDirectory, `${request.id}.receipt.json`)));
  requireCondition(recorded.length > 0, 'No generated candidates');
  requireCondition(recorded.length === requests.length, 'Generate all planned candidates before final selection');
  requireCondition(review.candidates.length === recorded.length, 'Review must cover every generated candidate');
  const seen = new Set();
  for (const candidate of review.candidates) {
    requireCondition(!seen.has(candidate.id), 'Duplicate candidate review');
    seen.add(candidate.id);
    requireCondition(recorded.some(request => request.id === candidate.id), 'Review refers to an unrecorded candidate');
    const request = requests.find(item => item.id === candidate.id);
    const receipt = candidateReceipt(runDirectory, request);
    requireCondition(candidate.imageSha256 === receipt.imageSha256, 'Reviewer inspected a different image');
    for (const axis of reviewAxes) {
      requireCondition(typeof candidate[axis]?.pass === 'boolean' && candidate[axis]?.observation?.trim(), `Missing visual judgment: ${axis}`);
    }
  }
  const selected = review.candidates.find(candidate => candidate.id === review.selected);
  requireCondition(selected || review.selected === null, 'Unknown final selection');
  const holdPath = selected && join(runDirectory, `${selected.id}.hold.json`);
  const hold = holdPath && existsSync(holdPath) ? readJson(holdPath) : null;
  if (hold) requireCondition(hold.id === selected.id && hold.imageSha256 === selected.imageSha256 && hold.reporter?.trim() && hold.observation?.trim(), 'Invalid held finding');
  const accepted = Boolean(selected && !hold && reviewAxes.every(axis => selected[axis].pass));
  return {
    pageId: plan.pageId,
    accepted,
    selected: accepted ? review.selected : null,
    reviewer: review.reviewer,
    approvalScope: 'composition-only',
    evidenceApproved: false,
    reviewSha256: digest(readFileSync(reviewPath)),
    reason: hold ? `Unresolved finding by ${hold.reporter}: ${hold.observation}` : accepted ? 'Independent review passed all four visual judgments on this recorded bitmap. Factual assets still require native verification.' : 'Revise the observations marked as failing and generate a new study.'
  };
}

export function implementationHandoff(runDirectory, reviewPath) {
  const decision = checkReview(runDirectory, reviewPath);
  requireCondition(decision.accepted, `Implementation blocked: ${decision.reason}`);
  const { inputs, guidance, plan, requests } = loadRun(runDirectory);
  const request = requests.find(item => item.id === decision.selected);
  const receipt = candidateReceipt(runDirectory, request);
  return {
    ...decision,
    selectedImage: receipt.path,
    imageSha256: receipt.imageSha256,
    referenceImages: inputs.references,
    prompt: [
      `Implement page ${plan.pageId}. Actually view the selected study at ${receipt.path} and its source/design reference images. Selection approves composition only; evidenceApproved is false.`,
      guidance,
      contextBrief(plan, inputs.references, inputs.placeholders ?? []),
      'Preserve the useful density, text hierarchy and figure-to-text relationships you can see. Build editable text and relationships from verified source facts; restore original images, verified crops and deterministic source-data plots. Never crop factual evidence out of the generated study. Check the real labels and source qualifications at their final scale.',
      'Compare professional reference, study and native render at equal width. Review live, reduced-motion and exported/offline states after final styles. Use the four judgments below on the real result; the study pass does not approve the native page.',
      reviewCriteria,
      'The lead checks the actual result and unresolved findings before delivery. Revisit sources and the existing page plan if required; a passing reviewer or technical check does not override a concrete unresolved failure.'
    ].join('\n\n')
  };
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === 'prepare') result = prepareStudy(args[0], args[1]);
    else if (command === 'record') result = recordCandidate(args[0], args[1], args[2]);
    else if (command === 'check') result = checkReview(args[0], args[1]);
    else if (command === 'hold') result = holdCandidate(args[0], args[1]);
    else if (command === 'handoff') result = implementationHandoff(args[0], args[1]);
    else throw new Error('Usage: visual-study.mjs prepare <plan.json> <new-run-dir> | record <run-dir> <candidate-id> <png> | check <run-dir> <review.json> | hold <run-dir> <finding.json> | handoff <run-dir> <review.json>');
    console.log(JSON.stringify(result, null, 2));
    if (command === 'check' && !result.accepted) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
