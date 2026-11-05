import * as THREE from "three";
import { makeCanvas } from "./util";

/**
 * Animated hacker terminal drawn on a 2D canvas that is used as the laptop
 * screen texture. Layout is authored in a 1120x700 design space.
 */

const W = 1120;
const H = 700;
const SCALE = 1.6; // canvas is 1792 x 1120 (16:10)

const FONT =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

const C = {
  bg: "#030806",
  panel: "#06100c",
  edge: "#17352a",
  dim: "#3f6b57",
  text: "#86b9a0",
  hi: "#a9d6bd",
  teal: "#3d9e98",
  amber: "#a8956a",
  red: "#a86565",
  green: "#4fae80",
};

type Tok = [string, "k" | "t" | "s" | "f" | "n" | "c" | "y"];

const TOK_COLOR: Record<Tok[1], string> = {
  k: "#5fb3a0",
  t: "#8fb5a2",
  s: "#b0a068",
  f: "#7fcf9d",
  n: "#6aa7c9",
  c: "#4b6b5c",
  y: "#6fbf9a",
};

const CODE: Tok[][] = [
  [["import", "k"], [" { connect, verify } ", "t"], ["from", "k"], [' "@iei/core";', "s"]],
  [],
  [["const", "k"], [" gateway = ", "t"], ["await", "k"], [" connect", "f"], ["({", "t"]],
  [["  host: ", "t"], ['"portal.iei-iste.nitte"', "s"], [",", "t"]],
  [["  port: ", "t"], ["8443", "n"], [",", "t"]],
  [["  tls: { cipher: ", "t"], ['"AES-256-GCM"', "s"], [" },", "t"]],
  [["});", "t"]],
  [],
  [["// authenticate operator session", "c"]],
  [["async function", "k"], [" ", "t"], ["authenticate", "f"], ["(token: ", "t"], ["string", "y"], [") {", "t"]],
  [["  const", "k"], [" claims = ", "t"], ["await", "k"], [" verify", "f"], ["(token);", "t"]],
  [["  if", "k"], [" (!claims.valid) ", "t"], ["throw", "k"], [" new ", "t"], ["Error", "y"], ["(", "t"], ['"denied"', "s"], [");", "t"]],
  [["  return", "k"], [" gateway.", "t"], ["open", "f"], ["(claims.scope);", "t"]],
  [["}", "t"]],
  [],
  [["await", "k"], [" authenticate", "f"], ["(process.env.", "t"], ["TOKEN", "n"], [");", "t"]],
  [["gateway.", "t"], ["stream", "f"], ["({ mode: ", "t"], ['"deep"', "s"], [" });", "t"]],
];

const CODE_TOTAL = CODE.reduce(
  (sum, line) => sum + line.reduce((s, tok) => s + tok[0].length, 0) + 1,
  0
);

const LOG: [string, string][] = [
  ["INFO", "tls handshake complete peer=10.8.0.14"],
  ["OK", "aes-256-gcm session key rotated"],
  ["INFO", "resolve gateway.iei-iste.local"],
  ["WARN", "upstream timeout 412ms, retry 2/5"],
  ["OK", "firewall ruleset 4417 applied"],
  ["INFO", "spawn worker pool size=8"],
  ["OK", "token verified sub=navsetu scope=root"],
  ["INFO", "sync shard 07 -> 12 (2.4 GB)"],
  ["DBG", "heap 412MB gc pause 3.1ms"],
  ["OK", "integrity check sha256 passed"],
  ["INFO", "capture eth0 1.2k pps"],
  ["INFO", "route table updated +3 -1"],
  ["OK", "ids signature db up to date"],
  ["WARN", "port scan blocked 203.0.113.9"],
];

const LEVEL_COLOR: Record<string, string> = {
  INFO: C.teal,
  OK: C.green,
  WARN: C.amber,
  DBG: C.dim,
};

const GLOBE_NODES: [number, number][] = [
  [0.2, 0.4], [0.7, 1.4], [-0.3, 2.2], [0.1, 3.4], [-0.6, 4.4],
  [0.5, 5.4], [-0.1, 0.0], [0.9, 2.9], [-0.8, 1.0],
];

export function createTerminal() {
  const { canvas, ctx } = makeCanvas(W * SCALE, H * SCALE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  const startSeconds = 21 * 3600 + 14 * 60 + 7;

  function text(
    s: string,
    x: number,
    y: number,
    color: string,
    size = 11,
    bold = false
  ) {
    ctx.font = `${bold ? "bold " : ""}${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  }

  function panel(x: number, y: number, w: number, h: number, title: string) {
    ctx.fillStyle = C.panel;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.fillStyle = "#0a1a13";
    ctx.fillRect(x + 1, y + 1, w - 2, 18);
    text(title, x + 8, y + 13.5, C.hi, 10, true);
  }

  function bar(x: number, y: number, w: number, h: number, v: number, color: string) {
    ctx.fillStyle = "#0b1d15";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.max(0, Math.min(1, v)) * w, h);
  }

  function spark(
    x: number, y: number, w: number, h: number,
    t: number, seed: number, speed: number, color: string, fill = true
  ) {
    const n = 54;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const v =
        0.5 +
        0.28 * Math.sin(i * 0.32 + t * speed + seed) +
        0.14 * Math.sin(i * 0.93 - t * speed * 1.7 + seed * 3);
      const px = x + (i / (n - 1)) * w;
      const py = y + h - v * h;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (fill) {
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function globe(cx: number, cy: number, R: number, t: number) {
    const a = t * 0.35;
    const tilt = 0.42;
    const proj = (lat: number, lon: number): [number, number, number] => {
      const cl = Math.cos(lat);
      const x = cl * Math.sin(lon + a);
      const y = Math.sin(lat);
      const z = cl * Math.cos(lon + a);
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt);
      const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      return [cx + R * x, cy - R * y2, z2];
    };

    const front = new Path2D();
    const back = new Path2D();
    const addLine = (pts: [number, number, number][]) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const path = (p0[2] + p1[2]) / 2 > 0 ? front : back;
        path.moveTo(p0[0], p0[1]);
        path.lineTo(p1[0], p1[1]);
      }
    };

    for (let lon = 0; lon < 360; lon += 30) {
      const pts: [number, number, number][] = [];
      for (let lat = -90; lat <= 90; lat += 10) {
        pts.push(proj((lat * Math.PI) / 180, (lon * Math.PI) / 180));
      }
      addLine(pts);
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: [number, number, number][] = [];
      for (let lon = 0; lon <= 360; lon += 10) {
        pts.push(proj((lat * Math.PI) / 180, (lon * Math.PI) / 180));
      }
      addLine(pts);
    }

    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "rgba(61,158,152,0.16)";
    ctx.stroke(back);
    ctx.strokeStyle = "rgba(95,179,160,0.7)";
    ctx.stroke(front);

    const projected = GLOBE_NODES.map(([la, lo]) => proj(la, lo));
    ctx.strokeStyle = "rgba(169,214,189,0.4)";
    [[0, 3], [1, 5], [2, 7], [4, 8]].forEach(([i, j]) => {
      const p = projected[i];
      const q = projected[j];
      if (p[2] > 0 && q[2] > 0) {
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.quadraticCurveTo(
          (p[0] + q[0]) / 2,
          (p[1] + q[1]) / 2 - R * 0.35,
          q[0],
          q[1]
        );
        ctx.stroke();
      }
    });
    projected.forEach((p, i) => {
      if (p[2] <= 0) return;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
      ctx.fillStyle = C.hi;
      ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3);
      ctx.strokeStyle = `rgba(127,207,157,${0.5 * pulse})`;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.strokeStyle = "rgba(95,179,160,0.5)";
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw(t: number) {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // ---------- Title bar ----------
    ctx.fillStyle = "#071410";
    ctx.fillRect(0, 0, W, 34);
    ["#a86565", "#a8956a", "#4fae80"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(20 + i * 18, 17, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    text("navsetu@iei-iste: ~/gateway  -  secure shell", 90, 21, C.text, 12);
    const sec = Math.floor(startSeconds + t);
    const hh = String(Math.floor(sec / 3600) % 24).padStart(2, "0");
    const mm = String(Math.floor(sec / 60) % 60).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    text(`${hh}:${mm}:${ss}  UTC+5:30`, 860, 21, C.dim, 12);
    ctx.fillStyle = C.green;
    ctx.beginPath();
    ctx.arc(1096, 17, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // ---------- Left: system log ----------
    panel(14, 44, 346, 590, "SYSTEM LOG  /var/log/gateway.log");
    ctx.save();
    ctx.beginPath();
    ctx.rect(15, 64, 344, 568);
    ctx.clip();
    const rate = 2.4;
    const head = t * rate;
    const headIdx = Math.floor(head);
    const frac = head - headIdx;
    const rows = 38;
    const lineH = 14.6;
    for (let r = 0; r < rows + 1; r++) {
      const n = headIdx - (rows - r);
      const h = ((n * 2654435761) >>> 0) % LOG.length;
      const [lvl, msg] = LOG[h];
      const s2 = (startSeconds + Math.floor(n * 0.42)) % 86400;
      const stamp = `${String(Math.floor(s2 / 3600)).padStart(2, "0")}:${String(
        Math.floor(s2 / 60) % 60
      ).padStart(2, "0")}:${String(s2 % 60).padStart(2, "0")}`;
      const y = 78 + r * lineH - frac * lineH;
      const alpha = Math.min(1, 0.25 + (r / rows) * 0.9);
      ctx.globalAlpha = alpha;
      text(stamp, 22, y, C.dim, 10);
      text(lvl.padEnd(4), 76, y, LEVEL_COLOR[lvl], 10, true);
      text(msg, 106, y, C.text, 10);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ---------- Centre: code editor ----------
    panel(372, 44, 388, 286, "gateway.ts");
    ctx.fillStyle = "#08150f";
    ctx.fillRect(373, 63, 386, 16);
    text("gateway.ts", 380, 75, C.hi, 10);
    text("auth.ts", 450, 75, C.dim, 10);
    text("stream.ts", 506, 75, C.dim, 10);

    ctx.font = `11px ${FONT}`;
    const cw = ctx.measureText("M").width;
    const cycle = CODE_TOTAL + 70;
    const reveal = Math.floor((t * 22) % cycle);
    let remaining = Math.min(reveal, CODE_TOTAL);
    let cursorX = 408;
    let cursorY = 96;
    for (let i = 0; i < CODE.length; i++) {
      const y = 96 + i * 13.4;
      text(String(i + 1).padStart(2, " "), 380, y, "#2b4a3b", 10);
      let x = 408;
      for (const [str, kind] of CODE[i]) {
        if (remaining <= 0) break;
        const part = str.slice(0, remaining);
        text(part, x, y, TOK_COLOR[kind], 11);
        x += part.length * cw;
        remaining -= part.length;
      }
      cursorX = x;
      cursorY = y;
      if (remaining <= 0) break;
      remaining -= 1;
    }
    if (Math.floor(t * 2.2) % 2 === 0) {
      ctx.fillStyle = C.hi;
      ctx.fillRect(cursorX + 1, cursorY - 10, 6, 12);
    }

    // ---------- Centre: traffic chart ----------
    panel(372, 338, 388, 130, "TRAFFIC ANALYSIS  eth0");
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = "rgba(61,158,152,0.12)";
      ctx.beginPath();
      ctx.moveTo(380, 366 + i * 24);
      ctx.lineTo(752, 366 + i * 24);
      ctx.stroke();
    }
    spark(380, 360, 372, 98, t, 1.0, 1.1, C.green);
    spark(380, 360, 372, 98, t, 4.2, 0.8, C.teal);
    text("RX", 710, 380, C.green, 9, true);
    text("TX", 730, 380, C.teal, 9, true);

    // ---------- Centre: process table ----------
    panel(372, 476, 388, 158, "PROCESS MONITOR");
    text("PID", 382, 505, C.dim, 9);
    text("NAME", 424, 505, C.dim, 9);
    text("CPU", 600, 505, C.dim, 9);
    text("MEM", 690, 505, C.dim, 9);
    const procs = ["gatewayd", "tls-proxy", "ids-engine", "sync-agent", "key-vault", "logshipper"];
    procs.forEach((name, i) => {
      const y = 521 + i * 18;
      const cpu = 0.3 + 0.3 * Math.sin(t * 0.9 + i * 1.7) + 0.1 * Math.sin(t * 2.3 + i);
      text(String(1204 + i * 37), 382, y, C.text, 10);
      text(name, 424, y, C.hi, 10);
      bar(600, y - 8, 70, 7, cpu, i === 2 ? C.amber : C.green);
      bar(690, y - 8, 56, 7, 0.25 + 0.1 * i, C.teal);
    });

    // ---------- Right: network status ----------
    panel(772, 44, 334, 150, "NETWORK STATUS");
    const lat = 22 + Math.round(6 * Math.sin(t * 1.3));
    const pps = (14.2 + 0.8 * Math.sin(t * 0.7)).toFixed(1);
    text("UPLINK", 782, 78, C.dim, 10);
    text("ONLINE", 850, 78, C.green, 10, true);
    text("LATENCY", 782, 96, C.dim, 10);
    text(`${lat} ms`, 850, 96, C.hi, 10);
    text("PACKETS", 782, 114, C.dim, 10);
    text(`${pps}k/s`, 850, 114, C.hi, 10);
    text("LOSS", 782, 132, C.dim, 10);
    text("0.00 %", 850, 132, C.hi, 10);
    spark(782, 142, 314, 42, t, 2.0, 1.4, C.teal);

    // ---------- Right: encryption ----------
    panel(772, 202, 334, 104, "ENCRYPTION STATUS");
    text("CIPHER", 782, 236, C.dim, 10);
    text("AES-256-GCM", 850, 236, C.hi, 10, true);
    text("HANDSHAKE", 782, 254, C.dim, 10);
    text("RSA-4096  verified", 850, 254, C.green, 10);
    text("KEY ROTATION", 782, 276, C.dim, 10);
    const rot = (t * 0.07) % 1;
    bar(870, 268, 168, 8, rot, C.teal);
    text(`${Math.floor(rot * 100)}%`, 1048, 276, C.hi, 10);
    text("ENTROPY", 782, 294, C.dim, 10);
    bar(870, 287, 168, 8, 0.92, C.green);
    text("SECURE", 1048, 295, C.green, 10, true);

    // ---------- Right: globe ----------
    panel(772, 314, 334, 190, "GLOBAL NODES");
    globe(862, 414, 68, t);
    text("NODES", 958, 372, C.dim, 10);
    text("128", 1030, 372, C.hi, 10, true);
    text("ONLINE", 958, 390, C.dim, 10);
    text("126", 1030, 390, C.green, 10, true);
    text("REGIONS", 958, 408, C.dim, 10);
    text("07", 1030, 408, C.hi, 10, true);
    text("SYNC", 958, 426, C.dim, 10);
    bar(958, 432, 130, 6, (t * 0.11) % 1, C.teal);
    text("ROUTE", 958, 454, C.dim, 10);
    text("BLR > SIN > FRA", 958, 468, C.text, 10);

    // ---------- Right: monitoring ----------
    panel(772, 512, 334, 122, "MONITORING");
    for (let i = 0; i < 16; i++) {
      const v = 0.3 + 0.3 * Math.sin(t * 1.2 + i * 0.7) + 0.2 * Math.sin(t * 2.1 + i * 1.9);
      const bh = Math.max(4, v * 56);
      ctx.fillStyle = i % 5 === 0 ? C.teal : C.green;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(784 + i * 10, 580 - bh, 7, bh);
      ctx.globalAlpha = 1;
    }
    text("CPU", 960, 548, C.dim, 10);
    bar(990, 541, 100, 7, 0.42 + 0.1 * Math.sin(t), C.green);
    text("MEM", 960, 568, C.dim, 10);
    bar(990, 561, 100, 7, 0.61, C.teal);
    text("DISK", 960, 588, C.dim, 10);
    bar(990, 581, 100, 7, 0.34, C.green);
    text("TEMP", 960, 608, C.dim, 10);
    bar(990, 601, 100, 7, 0.48, C.amber);

    // ---------- Footer prompt ----------
    ctx.fillStyle = "#071410";
    ctx.fillRect(0, 642, W, 58);
    text("navsetu@iei-iste:~$", 16, 668, C.green, 12, true);
    text("./gateway --secure --stream deep", 160, 668, C.hi, 12);
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = C.hi;
      ctx.fillRect(160 + 33 * 7.2 + 4, 656, 8, 14);
    }
    text("LOADING MODULES", 16, 690, C.dim, 10);
    const prog = (t * 0.09) % 1;
    bar(130, 682, 320, 8, prog, C.green);
    text(`${Math.floor(prog * 100)}%`, 462, 690, C.hi, 10);
    text("session 0x4F2A  |  uptime 14d 03h  |  load 0.42", 640, 690, C.dim, 10);

    texture.needsUpdate = true;
  }

  draw(0);

  return {
    texture,
    draw,
    dispose() {
      texture.dispose();
    },
  };
}

export const SCREEN_ASPECT = 1.6;
