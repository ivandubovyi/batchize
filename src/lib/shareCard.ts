// A tool nobody can show anyone has no way to spread. This renders the result
// of a check as an image a founder can post.
//
// It contains the score, the four dimension readings, and the counts. It
// contains none of the answers, deliberately: what you write stays on your
// machine unless you deliberately sync it, and a share button that quietly
// leaked a sentence of your traction would make that promise worthless.

import type { FullAudit } from "./analyzer";

const W = 1200;
const H = 630;

const CREAM = "#FDFBF7";
const INK = "#14161A";
const MUTED = "#5B6270";
const LINE = "#E7E3DA";
const ORANGE = "#F0741F";

function scoreColor(total: number): string {
  return total >= 70 ? "#12B76A" : total >= 45 ? "#F79009" : "#D92D20";
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const FONT = (weight: number, size: number) =>
  `${weight} ${size}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;

/**
 * Draws the card. Returns the canvas so callers can turn it into a blob, a
 * data URL, or put it straight on the page.
 */
export function renderShareCard(audit: FullAudit): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, W, H);

  // Warm corner wash, the same one the social card uses.
  const wash = ctx.createRadialGradient(W - 60, 40, 40, W - 60, 40, 620);
  wash.addColorStop(0, "rgba(240,116,31,0.28)");
  wash.addColorStop(1, "rgba(240,116,31,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // Wordmark
  ctx.fillStyle = INK;
  ctx.font = FONT(800, 32);
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Batchize", 76, 92);
  ctx.fillStyle = ORANGE;
  ctx.fillText(".", 76 + ctx.measureText("Batchize").width, 92);

  // Score ring
  const cx = 268;
  const cy = 320;
  const radius = 118;
  const color = scoreColor(audit.total);

  ctx.lineWidth = 26;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    radius,
    -Math.PI / 2,
    -Math.PI / 2 + (Math.PI * 2 * audit.total) / 100
  );
  ctx.stroke();
  ctx.lineCap = "butt";

  ctx.fillStyle = INK;
  ctx.font = FONT(800, 92);
  ctx.textAlign = "center";
  ctx.fillText(String(audit.total), cx, cy + 20);
  ctx.font = FONT(600, 21);
  ctx.fillStyle = MUTED;
  ctx.fillText("out of 100", cx, cy + 54);
  ctx.textAlign = "left";

  // Verdict
  const left = 452;
  ctx.fillStyle = color;
  ctx.font = FONT(800, 46);
  const verdictLines = wrap(ctx, audit.verdictTitle, W - left - 76);
  let y = 208;
  for (const l of verdictLines.slice(0, 2)) {
    ctx.fillText(l, left, y);
    y += 54;
  }

  ctx.fillStyle = MUTED;
  ctx.font = FONT(500, 23);
  const counts = `${audit.reds} red ${audit.reds === 1 ? "flag" : "flags"} · ${audit.ambers} to tighten · ${audit.greens} working · ${audit.coverage}% answered`;
  ctx.fillText(counts, left, y + 8);
  y += 56;

  // Dimension bars
  const dims: [string, number][] = [
    ["Clarity", audit.clarity],
    ["Evidence", audit.evidence],
    ["Insight", audit.insight],
    ["Ambition", audit.ambition],
  ];
  const barX = left + 122;
  const barW = W - barX - 130;
  for (const [name, value] of dims) {
    ctx.fillStyle = INK;
    ctx.font = FONT(700, 20);
    ctx.fillText(name, left, y + 6);

    ctx.fillStyle = LINE;
    roundRect(ctx, barX, y - 9, barW, 14, 7);
    ctx.fill();

    ctx.fillStyle = ORANGE;
    roundRect(ctx, barX, y - 9, Math.max(14, (barW * value) / 10), 14, 7);
    ctx.fill();

    ctx.fillStyle = MUTED;
    ctx.font = FONT(700, 19);
    ctx.textAlign = "right";
    ctx.fillText(value.toFixed(1), W - 76, y + 6);
    ctx.textAlign = "left";
    y += 40;
  }

  // Footer strip
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(76, H - 96);
  ctx.lineTo(W - 76, H - 96);
  ctx.stroke();

  ctx.fillStyle = MUTED;
  ctx.font = FONT(600, 21);
  ctx.fillText("Checked free at ivandubovyi.github.io/batchize", 76, H - 54);

  ctx.textAlign = "right";
  ctx.font = FONT(500, 19);
  ctx.fillText("No account needed. Nothing uploaded.", W - 76, H - 54);
  ctx.textAlign = "left";

  return canvas;
}

/** Suggested post text. The numbers are the founder's own. */
export function shareText(audit: FullAudit): string {
  return `My YC application scored ${audit.total}/100 on Batchize: ${audit.reds} red ${
    audit.reds === 1 ? "flag" : "flags"
  }, ${audit.ambers} to tighten. It checks every answer against what the question is really asking, and against your other answers. Free, no account needed, nothing uploaded unless you ask: ivandubovyi.github.io/batchize`;
}

export function downloadShareCard(audit: FullAudit): Promise<void> {
  return new Promise((resolve) => {
    const canvas = renderShareCard(audit);
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batchize-score-${audit.total}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    }, "image/png");
  });
}
