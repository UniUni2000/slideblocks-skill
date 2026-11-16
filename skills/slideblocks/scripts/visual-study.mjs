import { createHash } from 'node:crypto';
import { constants, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
    section(design, 'Reason about typography'),
    section(design, 'Perform an aesthetic critique')
  ].join('\n\n');
}

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
  const guidance = effectiveGuidance();
  const names = new Set();
  const requests = plan.variants.map(variant => {
    requireCondition(variant.id?.match(/^[a-zA-Z0-9_-]+$/), 'Candidate id must be a safe file identifier');
    requireCondition(!names.has(variant.id), 'Candidate ids must be unique');
    names.add(variant.id);
    requireCondition(variant.prompt?.trim(), 'Candidate needs a design instruction');
    const roles = references.map((reference, index) => `Image ${index + 1} [${reference.role}]: ${reference.description}`).join('\n');
    const prompt = [
      'Produce one complete 16:9 presentation mockup. Apply the following effective guidance to the bitmap itself.',
      guidance,
      'Reference roles: source images supply facts. Design and approved images calibrate visual expression, not factual claims. Rejected images show defects to avoid. Choose composition for the present content.',
      roles,
      `Audience and question\n${plan.brief}`,
      plan.taste ? `Applied owner preferences\n${plan.taste}` : '',
      `Content and source boundary\n${plan.content}`,
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
  saveJson(join(runDirectory, 'requests.json'), requests);
  saveJson(join(runDirectory, 'inputs.json'), {
    references,
    guidanceSha256: digest(guidance),
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
  return { inputs, requests: readJson(join(runDirectory, 'requests.json')), plan: readJson(join(runDirectory, 'plan.json')) };
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
    const receipt = readJson(join(runDirectory, `${candidate.id}.receipt.json`));
    const request = requests.find(item => item.id === candidate.id);
    requireCondition(digest(request.prompt) === receipt.promptSha256, 'Generation prompt changed');
    requireCondition(digest(readFileSync(receipt.path)) === receipt.imageSha256, 'Candidate changed after generation');
    requireCondition(candidate.imageSha256 === receipt.imageSha256, 'Reviewer inspected a different image');
    for (const axis of reviewAxes) {
      requireCondition(typeof candidate[axis]?.pass === 'boolean' && candidate[axis]?.observation?.trim(), `Missing visual judgment: ${axis}`);
    }
  }
  const selected = review.candidates.find(candidate => candidate.id === review.selected);
  requireCondition(selected || review.selected === null, 'Unknown final selection');
  const accepted = Boolean(selected && reviewAxes.every(axis => selected[axis].pass));
  return {
    pageId: plan.pageId,
    accepted,
    selected: accepted ? review.selected : null,
    reviewer: review.reviewer,
    reviewSha256: digest(readFileSync(reviewPath)),
    reason: accepted ? 'Independent review passed all four visual judgments on this recorded bitmap.' : 'Revise the observations marked as failing and generate a new study.'
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, ...args] = process.argv.slice(2);
    let result;
    if (command === 'prepare') result = prepareStudy(args[0], args[1]);
    else if (command === 'record') result = recordCandidate(args[0], args[1], args[2]);
    else if (command === 'check') result = checkReview(args[0], args[1]);
    else throw new Error('Usage: visual-study.mjs prepare <plan.json> <new-run-dir> | record <run-dir> <candidate-id> <png> | check <run-dir> <review.json>');
    console.log(JSON.stringify(result, null, 2));
    if (command === 'check' && !result.accepted) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
