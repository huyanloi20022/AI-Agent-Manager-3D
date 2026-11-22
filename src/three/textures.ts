import * as THREE from 'three';

/** Procedural oak wood plank texture for Lounge & desks */
export function createWoodTexture(baseHex = '#b07d4f', grainHex = '#8c5e34', repeatX = 4, repeatY = 4): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankH = 64;
  for (let row = 0; row < 8; row++) {
    const y = row * plankH;
    const shade = (row % 3 - 1) * 8;
    ctx.fillStyle = shade > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, y, 512, plankH);

    // Subtle wood grain streaks
    ctx.strokeStyle = grainHex;
    ctx.globalAlpha = 0.22;
    for (let g = 0; g < 10; g++) {
      ctx.beginPath();
      const gy = y + 4 + g * 6;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + ((row + g) % 2 ? 3 : -3), 340, gy + ((row + g) % 2 ? -2 : 2), 512, gy);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Plank seam
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, y, 512, 2);
    const offset = (row % 2) * 256;
    ctx.fillRect(offset, y, 2, plankH);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Procedural modern architectural floor tile texture for hallways */
export function createFloorTileTexture(isDay = true): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = isDay ? '#e2e8f0' : '#131c2e';
  ctx.fillRect(0, 0, 512, 512);

  const step = 128;
  for (let x = 0; x < 512; x += step) {
    for (let y = 0; y < 512; y += step) {
      const alt = ((x / step) + (y / step)) % 2 === 0;
      ctx.fillStyle = isDay
        ? alt ? 'rgba(255,255,255,0.28)' : 'rgba(148,163,184,0.08)'
        : alt ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
    }
  }
  ctx.strokeStyle = isDay ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.12)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += step) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Procedural woven office carpet texture per department */
export function createCarpetTexture(tintHex: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = tintHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 4) {
    ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, y, 256, 2);
  }
  for (let x = 0; x < 256; x += 6) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(x, 0, 2, 256);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Realistic computer screen texture depending on department role */
export function createScreenTexture(
  kind: 'ceo' | 'assistant' | 'design' | 'frontend' | 'backend' | 'review' | 'qa' | 'release',
  accent: string
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Dark IDE / dashboard screen background
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, 512, 256);

  // Window title bar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 26);
  ['#ef4444', '#f59e0b', '#22c55e'].forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(16 + i * 16, 13, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });

  if (kind === 'design') {
    // UI Wireframe & Donut Chart preview
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, 40, 140, 196);
    ctx.fillRect(172, 40, 324, 92);
    ctx.fillRect(172, 146, 154, 90);
    ctx.fillRect(342, 146, 154, 90);
    // Donut chart
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(248, 191, 26, 0, Math.PI * 1.3); ctx.stroke();
    ctx.strokeStyle = '#ec4899';
    ctx.beginPath(); ctx.arc(248, 191, 26, Math.PI * 1.3, Math.PI * 2); ctx.stroke();
    // Bar chart
    ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'].forEach((col, i) => {
      const h = 24 + ((i * 19) % 45);
      ctx.fillStyle = col;
      ctx.fillRect(360 + i * 24, 224 - h, 14, h);
    });
  } else if (kind === 'qa') {
    // Green Vitest PASS output
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('✓ vitest --run  20/20 PASSED', 24, 72);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '15px monospace';
    ctx.fillText('✓ finance.test.ts (20 tests) 9ms', 24, 110);
    ctx.fillText('✓ tsc --noEmit  0 errors', 24, 140);
    ctx.fillText('✓ vite build    dist/ ready', 24, 170);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(24, 196, 460, 18);
  } else if (kind === 'ceo' || kind === 'assistant') {
    // Executive KPI dashboard
    [accent, '#3b82f6', '#22c55e'].forEach((col, i) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(18 + i * 164, 42, 150, 68);
      ctx.fillStyle = col;
      ctx.fillRect(18 + i * 164, 42, 150, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(i === 0 ? '8/8' : i === 1 ? '100%' : 'PR #1', 34 + i * 164, 88);
    });
    // Trend line
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(24, 215);
    ctx.lineTo(120, 185);
    ctx.lineTo(220, 198);
    ctx.lineTo(340, 148);
    ctx.lineTo(480, 132);
    ctx.stroke();
  } else {
    // Syntax-highlighted code editor (Frontend, Backend, Review, Release)
    const colors = ['#60a5fa', '#c084fc', '#34d399', '#fbbf24', '#f472b6', '#94a3b8'];
    for (let row = 0; row < 11; row++) {
      const y = 42 + row * 18;
      let x = 22 + (row % 3) * 18;
      for (let seg = 0; seg < 4; seg++) {
        const w = 32 + ((row * 17 + seg * 29) % 72);
        if (x + w > 490) break;
        ctx.fillStyle = colors[(row + seg) % colors.length];
        ctx.fillRect(x, y, w, 9);
        x += w + 10;
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Wall whiteboard with colorful sticky notes & flowchart */
export function createWhiteboardTexture(title: string, accent: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 512, 34);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(title, 18, 24);

  // Sticky notes
  const notes = ['#fef08a', '#bae6fd', '#bbf7d0', '#fbcfe8', '#fde68a'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = notes[i];
    ctx.fillRect(24 + i * 94, 58, 76, 68);
    ctx.fillStyle = 'rgba(15,23,42,0.28)';
    ctx.fillRect(34 + i * 94, 76, 52, 6);
    ctx.fillRect(34 + i * 94, 90, 40, 6);
  }

  // Flowchart sketch at bottom
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.strokeRect(36 + i * 116, 158, 84, 52);
    if (i < 3) {
      ctx.beginPath();
      ctx.moveTo(120 + i * 116, 184);
      ctx.lineTo(152 + i * 116, 184);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Giant presentation screen texture for the Kickoff Meeting Room */
export function createMeetingScreenTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, 512, 256);

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(0, 0, 512, 42);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText('KICKOFF MEETING · AI AGENT COMPANY', 20, 28);

  // Project sprint roadmap blocks
  const stages = [
    { label: 'DESIGN', col: '#3b82f6' },
    { label: 'CODE', col: '#8b5cf6' },
    { label: 'REVIEW', col: '#06b6d4' },
    { label: 'QA TEST', col: '#f59e0b' },
    { label: 'APPROVE', col: '#22c55e' },
  ];
  stages.forEach((s, i) => {
    const x = 18 + i * 96;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, 66, 86, 62);
    ctx.fillStyle = s.col;
    ctx.fillRect(x, 66, 86, 8);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(s.label, x + 10, 104);
  });

  // Bottom bar chart + KPI
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(18, 146, 476, 88);
  ['#eab308', '#ec4899', '#3b82f6', '#8b5cf6', '#6366f1', '#06b6d4', '#f59e0b', '#22c55e'].forEach((col, i) => {
    const h = 28 + ((i * 13) % 40);
    ctx.fillStyle = col;
    ctx.fillRect(36 + i * 56, 222 - h, 34, h);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

