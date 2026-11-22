import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LOUNGE_CENTER, MEETING_CENTER, MEETING_SPOTS } from '../data/departments';
import type { AgentRuntime, Department, ProjectedRoomLabel, RoomFacing, RoomStatus } from '../types';
import {
  createCarpetTexture,
  createFloorTileTexture,
  createMeetingScreenTexture,
  createScreenTexture,
  createWhiteboardTexture,
  createWoodTexture,
} from './textures';

interface RoomVisual {
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  stripMat: THREE.MeshStandardMaterial;
  screenMat: THREE.MeshStandardMaterial;
  haloMesh: THREE.Mesh;
  haloMat: THREE.MeshBasicMaterial;
  anchorLocal: THREE.Vector3;
  baseColor: THREE.Color;
}

interface AgentVisual {
  root: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  taskCube: THREE.Mesh;
  taskMat: THREE.MeshStandardMaterial;
  coffeeCup: THREE.Group;
  statusLightMat: THREE.MeshStandardMaterial;
}

interface ConfettiParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
}

export interface SceneSnapshot {
  statuses: RoomStatus[];
  selectedIdx: number;
  agents: AgentRuntime[];
  autoOrbit: boolean;
  meetingActive: boolean;
  meetingSpeakerIdx: number;
}

function facingToAngle(facing: RoomFacing): number {
  switch (facing) {
    case 'south':
      return 0;
    case 'north':
      return Math.PI;
    case 'east':
      return Math.PI / 2;
    case 'west':
      return -Math.PI / 2;
  }
}

export class CompanyScene {
  private container: HTMLElement;
  private departments: Department[];
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private pmrem: THREE.PMREMGenerator;
  private rooms: RoomVisual[] = [];
  private agentVisuals: AgentVisual[] = [];
  private meetingStripMat!: THREE.MeshStandardMaterial;
  private meetingScreenMat!: THREE.MeshStandardMaterial;
  private meetingAnchor = new THREE.Vector3(MEETING_CENTER[0], 2.75, MEETING_CENTER[1]);
  private loungeAnchor = new THREE.Vector3(LOUNGE_CENTER[0], 2.2, LOUNGE_CENTER[1]);
  private confetti: ConfettiParticle[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downPos = { x: 0, y: 0 };
  private clock = new THREE.Clock();
  private rafId = 0;
  private snapshot: SceneSnapshot;
  private onSelectRoom: (idx: number) => void;
  private onProjectLabels: (labels: ProjectedRoomLabel[]) => void;

  constructor(
    container: HTMLElement,
    departments: Department[],
    initialSnapshot: SceneSnapshot,
    onSelectRoom: (idx: number) => void,
    onProjectLabels: (labels: ProjectedRoomLabel[]) => void
  ) {
    this.container = container;
    this.departments = departments;
    this.snapshot = initialSnapshot;
    this.onSelectRoom = onSelectRoom;
    this.onProjectLabels = onProjectLabels;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c1322');
    this.scene.fog = new THREE.FogExp2('#0c1322', 0.011);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.58;

    this.camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.1,
      180
    );
    this.camera.position.set(0, 19.5, 22.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minPolarAngle = 0.22;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 44;
    this.controls.autoRotate = initialSnapshot.autoOrbit;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.target.set(0, 0.5, 0);

    this.setupLights();
    this.buildOfficePlatform();
    this.buildGrandMeetingRoom();
    this.buildLoungeZone();
    this.buildDepartments();
    this.buildWalkingAgents();

    window.addEventListener('resize', this.handleResize);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.handlePointerUp);

    this.animate();
  }

  private setupLights() {
    const hemi = new THREE.HemisphereLight('#f8fafc', '#1e293b', 0.9);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight('#fff7ed', 1.8);
    sun.position.set(16, 28, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 70;
    const d = 19;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);

    // Executive spotlight over Center CEO Suite
    const ceoLight = new THREE.PointLight('#facc15', 1.7, 12);
    ceoLight.position.set(0, 4.2, -6.2);
    this.scene.add(ceoLight);

    // Conference glow over Grand Meeting Room
    const meetLight = new THREE.PointLight('#60a5fa', 2.4, 14);
    meetLight.position.set(MEETING_CENTER[0], 4.2, MEETING_CENTER[1]);
    this.scene.add(meetLight);

    // Warm cozy light over Café Lounge
    const loungeLight = new THREE.PointLight('#fbbf24', 2.3, 12);
    loungeLight.position.set(LOUNGE_CENTER[0], 3.6, LOUNGE_CENTER[1]);
    this.scene.add(loungeLight);

    const fill = new THREE.DirectionalLight('#93c5fd', 0.55);
    fill.position.set(-18, 12, -12);
    this.scene.add(fill);
  }

  private buildOfficePlatform() {
    const tileTex = createFloorTileTexture(false);
    tileTex.repeat.set(8, 6);
    const floorMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.45, metalness: 0.15 });
    const sideMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7, metalness: 0.25 });

    // Grand expanded HQ floor slab (24.8 x 17.8)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(24.8, 0.56, 17.8),
      [sideMat, sideMat, floorMat, sideMat, sideMat, sideMat]
    );
    floor.position.set(0, -0.28, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(25.0, 0.09, 18.0),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.75, roughness: 0.3 })
    );
    trim.position.set(0, -0.52, 0);
    this.scene.add(trim);

    // Ring corridor carpet runners (x=±6.1, z=±3.55)
    const runnerMat = new THREE.MeshStandardMaterial({ color: '#1b263b', roughness: 0.86 });
    const nWalk = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.015, 1.05), runnerMat);
    nWalk.position.set(0, 0.008, -3.55);
    nWalk.receiveShadow = true;
    this.scene.add(nWalk);

    const sWalk = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.015, 1.05), runnerMat);
    sWalk.position.set(0, 0.008, 3.55);
    sWalk.receiveShadow = true;
    this.scene.add(sWalk);

    [-6.1, 6.1].forEach((rx) => {
      const vWalk = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.015, 8.2), runnerMat);
      vWalk.position.set(rx, 0.008, 0);
      vWalk.receiveShadow = true;
      this.scene.add(vWalk);
    });
  }

  private buildPottedPlant(scale = 1): THREE.Group {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18 * scale, 0.13 * scale, 0.28 * scale, 14),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.65 })
    );
    pot.position.y = 0.14 * scale;
    pot.castShadow = true;
    g.add(pot);

    const leafMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.55 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.5 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.14 * scale, 10, 8),
        i % 2 === 0 ? leafMat : leafMat2
      );
      leaf.scale.set(1.3, 0.55, 0.8);
      leaf.position.set(Math.cos(ang) * 0.14 * scale, (0.42 + (i % 2) * 0.12) * scale, Math.sin(ang) * 0.14 * scale);
      leaf.rotation.y = ang;
      leaf.castShadow = true;
      g.add(leaf);
    }
    return g;
  }

  private buildOfficeChair(colorHex: string): THREE.Group {
    const chair = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.75, roughness: 0.3 });
    const cushion = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.78 });

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 10), metal);
    stem.position.y = 0.17;
    chair.add(stem);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.04, 5), metal);
    base.position.y = 0.04;
    chair.add(base);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.4), cushion);
    seat.position.y = 0.34;
    seat.castShadow = true;
    chair.add(seat);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.46, 0.06), cushion);
    back.position.set(0, 0.58, -0.17);
    back.castShadow = true;
    chair.add(back);

    return chair;
  }

  /** GRAND KICKOFF MEETING ROOM (8.6 x 4.6 — huge centerpiece conference hall!) */
  private buildGrandMeetingRoom() {
    const mr = new THREE.Group();
    mr.position.set(MEETING_CENTER[0], 0, MEETING_CENTER[1]);

    const carpet = new THREE.Mesh(
      new THREE.BoxGeometry(8.6, 0.14, 4.6),
      new THREE.MeshStandardMaterial({ map: createCarpetTexture('#16213e'), roughness: 0.86 })
    );
    carpet.position.y = 0.07;
    carpet.receiveShadow = true;
    mr.add(carpet);

    const plasterMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.8 });
    const aluminumMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.28 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.17, roughness: 0.06 });

    // West feature wall holding the GIANT 100-inch Presentation Display
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.25, 4.5), plasterMat);
    westWall.position.set(-4.24, 1.26, 0);
    westWall.castShadow = true;
    mr.add(westWall);

    const screenTex = createMeetingScreenTexture();
    this.meetingScreenMat = new THREE.MeshStandardMaterial({
      map: screenTex,
      emissiveMap: screenTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.72,
      roughness: 0.18,
    });
    const tvFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.35, 2.85),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.65, roughness: 0.28 })
    );
    tvFrame.position.set(-4.14, 1.42, 0);
    mr.add(tvFrame);

    const tvFace = new THREE.Mesh(new THREE.PlaneGeometry(2.74, 1.24), this.meetingScreenMat);
    tvFace.rotation.y = Math.PI / 2;
    tvFace.position.set(-4.08, 1.42, 0);
    mr.add(tvFace);

    // East glass wall
    const eastGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.15, 4.45), glassMat);
    eastGlass.position.set(4.24, 1.22, 0);
    mr.add(eastGlass);
    const eastTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 4.55), aluminumMat);
    eastTop.position.set(4.24, 2.32, 0);
    mr.add(eastTop);

    // North & South glass walls with wide grand double doorways in the center!
    [-2.25, 2.25].forEach((gz) => {
      [-2.75, 2.75].forEach((gx) => {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.15, 0.06), glassMat);
        panel.position.set(gx, 1.22, gz);
        mr.add(panel);
      });
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.08, 0.1), aluminumMat);
      topBar.position.set(0, 2.32, gz);
      mr.add(topBar);
      [-1.25, 1.25].forEach((jx) => {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.2, 0.09), aluminumMat);
        jamb.position.set(jx, 1.24, gz);
        mr.add(jamb);
      });
    });

    // Glowing architectural blue header strip
    this.meetingStripMat = new THREE.MeshStandardMaterial({
      color: '#3b82f6',
      emissive: '#3b82f6',
      emissiveIntensity: 0.95,
    });
    [-2.25, 2.25].forEach((gz) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.09, 0.12), this.meetingStripMat);
      strip.position.set(0, 2.4, gz);
      mr.add(strip);
    });

    // GIANT Executive Walnut Conference Table (4.5 x 1.85!)
    const walnut = new THREE.MeshStandardMaterial({ map: createWoodTexture('#5c3820', '#361e0f', 4, 2), roughness: 0.35 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 1.85), walnut);
    tableTop.position.set(0.15, 0.74, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    mr.add(tableTop);

    const pedMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.75, roughness: 0.28 });
    [-1.4, 0.15, 1.7].forEach((px) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.62, 16), pedMat);
      leg.position.set(px, 0.43, 0);
      mr.add(leg);
    });

    // Holographic projector ring at table center
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 0.07, 24),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.3 })
    );
    hub.position.set(0.15, 0.82, 0);
    mr.add(hub);

    // 8 Spacious Conference Chairs around the Grand Table
    MEETING_SPOTS.forEach(([sx, sz], i) => {
      const ch = this.buildOfficeChair(i === 0 ? '#92400e' : '#334155');
      const lx = sx - MEETING_CENTER[0];
      const lz = sz - MEETING_CENTER[1];
      ch.position.set(lx, 0.14, lz);
      ch.rotation.y = Math.atan2(0.15 - lx, 0 - lz) + Math.PI;
      mr.add(ch);
    });

    // Corner decorative plants inside the Grand Meeting Room
    [
      [3.75, -1.75],
      [3.75, 1.75],
      [-3.65, -1.75],
      [-3.65, 1.75],
    ].forEach(([px, pz]) => {
      const plant = this.buildPottedPlant(1.1);
      plant.position.set(px, 0.14, pz);
      mr.add(plant);
    });

    this.scene.add(mr);
  }

  private buildLoungeZone() {
    const lounge = new THREE.Group();
    lounge.position.set(LOUNGE_CENTER[0], 0, LOUNGE_CENTER[1]);

    const oakTex = createWoodTexture('#b07d4f', '#784b26', 5, 2);
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.14, 3.2),
      new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.5, metalness: 0.05 })
    );
    deck.position.y = 0.07;
    deck.receiveShadow = true;
    deck.castShadow = true;
    lounge.add(deck);

    const rug = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 0.02, 36),
      new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.92 })
    );
    rug.position.set(0.45, 0.15, 0);
    rug.receiveShadow = true;
    lounge.add(rug);

    const woodDark = new THREE.MeshStandardMaterial({ map: createWoodTexture('#5c3a21', '#3b2210', 2, 1), roughness: 0.5 });
    const marble = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.2 });

    // Espresso Bar Counter
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.78, 0.6), woodDark);
    counter.position.set(-2.15, 0.52, -0.92);
    counter.castShadow = true;
    lounge.add(counter);

    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.07, 0.68), marble);
    counterTop.position.set(-2.15, 0.94, -0.92);
    lounge.add(counterTop);

    const machine = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.38, 0.32),
      new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.22 })
    );
    machine.position.set(-2.35, 1.15, -0.92);
    lounge.add(machine);

    // Sofas
    const sofaMat = new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.85 });
    const pillowCols = ['#f59e0b', '#ec4899'];
    const buildSofa = (x: number, z: number, rotY: number) => {
      const s = new THREE.Group();
      s.position.set(x, 0.14, z);
      s.rotation.y = rotY;
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.68), sofaMat);
      base.position.y = 0.18;
      base.castShadow = true;
      s.add(base);
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.44, 0.18), sofaMat);
      back.position.set(0, 0.44, -0.24);
      back.castShadow = true;
      s.add(back);
      [-0.62, 0.62].forEach((px, pi) => {
        const pil = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.24, 0.1),
          new THREE.MeshStandardMaterial({ color: pillowCols[pi], roughness: 0.85 })
        );
        pil.position.set(px, 0.44, -0.09);
        pil.rotation.z = pi === 0 ? 0.18 : -0.15;
        s.add(pil);
      });
      lounge.add(s);
    };
    buildSofa(0.45, -1.0, 0);
    buildSofa(0.45, 1.0, Math.PI);

    // Glass-top coffee table
    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.3, 18), woodDark);
    tBase.position.set(0.45, 0.29, 0);
    lounge.add(tBase);
    const tTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.56, 0.56, 0.04, 28),
      new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.55, roughness: 0.08 })
    );
    tTop.position.set(0.45, 0.46, 0);
    lounge.add(tTop);

    [
      [-2.8, 1.2, 1.15],
      [2.8, -1.2, 1.2],
      [2.8, 1.2, 1.05],
    ].forEach(([px, pz, sc]) => {
      const plant = this.buildPottedPlant(sc);
      plant.position.set(px, 0.14, pz);
      lounge.add(plant);
    });

    const brass = new THREE.MeshStandardMaterial({ color: '#d97706', metalness: 0.85, roughness: 0.25 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.7, 10), brass);
    pole.position.set(-2.8, 0.98, -1.2);
    lounge.add(pole);
    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.28, 0.28, 18, 1, true),
      new THREE.MeshStandardMaterial({ color: '#fef3c7', emissive: '#fbbf24', emissiveIntensity: 1.4, side: THREE.DoubleSide })
    );
    shade.position.set(-2.8, 1.78, -1.2);
    lounge.add(shade);

    this.scene.add(lounge);
  }

  private buildDepartments() {
    const plasterMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.82 });
    const baseboardMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5, metalness: 0.3 });
    const aluminumMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.3, metalness: 0.8 });
    const deskWood = new THREE.MeshStandardMaterial({ map: createWoodTexture('#c2956b', '#8f633a', 2, 1), roughness: 0.45 });
    const ceoWood = new THREE.MeshStandardMaterial({ map: createWoodTexture('#4a2c18', '#29160a', 2, 1), roughness: 0.32 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#bae6fd', transparent: true, opacity: 0.19, roughness: 0.06 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.6 });

    this.departments.forEach((dept, idx) => {
      const isCEO = dept.equipment === 'ceo';
      const rw = isCEO ? 5.2 : 3.5;
      const rd = isCEO ? 3.2 : 2.95;
      const hw = rw / 2;
      const hd = rd / 2;

      const group = new THREE.Group();
      group.position.set(dept.position[0], dept.position[1], dept.position[2]);
      // Local room always faces +Z (front doorway at +hd, back wall at -hd), then rotated by facing!
      group.rotation.y = facingToAngle(dept.facing);

      const baseColor = new THREE.Color(dept.color);

      // Carpet floor pad (CEO room slightly elevated executive podium!)
      const padH = isCEO ? 0.24 : 0.16;
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(rw, padH, rd),
        new THREE.MeshStandardMaterial({
          map: createCarpetTexture(isCEO ? '#2d233a' : '#1e293b'),
          roughness: 0.86,
        })
      );
      pad.position.y = padH / 2;
      pad.receiveShadow = true;
      pad.castShadow = true;
      group.add(pad);

      // Back solid wall at -hd
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(rw, 1.9, 0.1), plasterMat);
      backWall.position.set(0, padH + 0.95, -hd + 0.05);
      backWall.castShadow = true;
      backWall.receiveShadow = true;
      group.add(backWall);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(rw + 0.02, 0.14, 0.12), baseboardMat);
      baseTrim.position.set(0, padH + 0.07, -hd + 0.05);
      group.add(baseTrim);

      // Side walls: CEO gets panoramic FULL GLASS on both left & right sides to observe both wings!
      if (isCEO) {
        [-hw + 0.04, hw - 0.04].forEach((sx) => {
          const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.85, rd - 0.12), glassMat);
          sideGlass.position.set(sx, padH + 0.92, 0);
          group.add(sideGlass);
          const sideTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, rd), aluminumMat);
          sideTop.position.set(sx, padH + 1.88, 0);
          group.add(sideTop);
        });
      } else {
        const leftLower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.72, rd - 0.1), plasterMat);
        leftLower.position.set(-hw + 0.04, padH + 0.36, 0);
        group.add(leftLower);
        const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, rd - 0.12), glassMat);
        leftGlass.position.set(-hw + 0.04, padH + 1.3, 0);
        group.add(leftGlass);
      }

      // Front glass partition at +hd with central OPEN DOORWAY (1.1 wide)
      const doorHalf = isCEO ? 0.7 : 0.52;
      const sidePanelW = hw - doorHalf - 0.06;
      [-1, 1].forEach((sign) => {
        const cx = sign * (doorHalf + sidePanelW / 2 + 0.03);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(sidePanelW, 1.82, 0.05), glassMat);
        panel.position.set(cx, padH + 0.91, hd - 0.04);
        group.add(panel);
      });
      const frontTop = new THREE.Mesh(new THREE.BoxGeometry(rw, 0.07, 0.09), aluminumMat);
      frontTop.position.set(0, padH + 1.86, hd - 0.04);
      group.add(frontTop);

      [-doorHalf, doorHalf].forEach((jx) => {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.86, 0.08), aluminumMat);
        jamb.position.set(jx, padH + 0.93, hd - 0.04);
        group.add(jamb);
      });

      // Glowing status header strip above doorway
      const stripMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 0.9,
      });
      const strip = new THREE.Mesh(new THREE.BoxGeometry(doorHalf * 2 + 0.1, 0.09, 0.11), stripMat);
      strip.position.set(0, padH + 1.94, hd - 0.04);
      group.add(strip);

      // Whiteboard / Executive Board on back wall
      const boardTex = createWhiteboardTexture(dept.short, dept.color);
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(isCEO ? 2.0 : 1.45, 0.76, 0.04),
        new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.35 })
      );
      board.position.set(0, padH + 1.24, -hd + 0.12);
      group.add(board);

      // Desk & Monitor (CEO gets huge walnut executive desk!)
      const deskZ = isCEO ? -0.35 : -0.45;
      const deskW = isCEO ? 2.4 : 1.8;
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(deskW, 0.08, 0.82),
        isCEO ? ceoWood : deskWood
      );
      desk.position.set(0, padH + 0.56, deskZ);
      desk.castShadow = true;
      group.add(desk);

      const legGeo = new THREE.BoxGeometry(0.06, 0.56, 0.06);
      [
        [-deskW / 2 + 0.1, deskZ - 0.32],
        [deskW / 2 - 0.1, deskZ - 0.32],
        [-deskW / 2 + 0.1, deskZ + 0.32],
        [deskW / 2 - 0.1, deskZ + 0.32],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, darkMetal);
        leg.position.set(lx, padH + 0.28, lz);
        group.add(leg);
      });

      const kb = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.16), darkMetal);
      kb.position.set(-0.08, padH + 0.61, deskZ + 0.18);
      group.add(kb);

      const screenTex = createScreenTexture(dept.equipment, dept.color);
      const screenMat = new THREE.MeshStandardMaterial({
        map: screenTex,
        emissiveMap: screenTex,
        emissive: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.58,
        roughness: 0.18,
      });

      const monBack = new THREE.Mesh(new THREE.BoxGeometry(isCEO ? 1.3 : 1.06, 0.56, 0.05), darkMetal);
      monBack.position.set(0, padH + 0.9, deskZ - 0.18);
      group.add(monBack);

      const monFace = new THREE.Mesh(new THREE.PlaneGeometry(isCEO ? 1.24 : 1.0, 0.5), screenMat);
      monFace.position.set(0, padH + 0.9, deskZ - 0.15);
      group.add(monFace);

      const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.06), aluminumMat);
      stand.position.set(0, padH + 0.68, deskZ - 0.18);
      group.add(stand);

      // Ergonomic Chair
      const chair = this.buildOfficeChair(isCEO ? '#78350f' : '#334155');
      chair.position.set(0, padH, deskZ + 0.68);
      chair.rotation.y = Math.PI;
      group.add(chair);

      // Cabinet + Potted Plant
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.92, 0.44), isCEO ? ceoWood : deskWood);
      cabinet.position.set(-hw + 0.42, padH + 0.46, -hd + 0.36);
      cabinet.castShadow = true;
      group.add(cabinet);

      const plant = this.buildPottedPlant(isCEO ? 1.05 : 0.85);
      plant.position.set(hw - 0.42, padH, -hd + 0.36);
      group.add(plant);

      if (dept.equipment === 'qa') {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.25, 0.48), darkMetal);
        rack.position.set(hw - 0.44, padH + 0.62, deskZ);
        group.add(rack);
      } else if (isCEO) {
        // Golden Human Gate Archway above CEO front entrance
        const arch = new THREE.Mesh(
          new THREE.TorusGeometry(0.72, 0.05, 12, 32, Math.PI),
          new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#eab308', emissiveIntensity: 0.8, metalness: 0.75 })
        );
        arch.position.set(0, padH + 1.9, hd - 0.04);
        group.add(arch);
      }

      const haloMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      });
      const haloMesh = new THREE.Mesh(new THREE.RingGeometry(0.38, 0.5, 28), haloMat);
      haloMesh.rotation.x = -Math.PI / 2;
      haloMesh.position.set(0, padH + 0.015, 0.45);
      group.add(haloMesh);

      const hitMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rw, 2.3, rd),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.position.y = 1.15;
      hitMesh.userData = { roomIdx: idx };
      group.add(hitMesh);

      this.scene.add(group);
      this.rooms.push({
        group,
        hitMesh,
        stripMat,
        screenMat,
        haloMesh,
        haloMat,
        anchorLocal: new THREE.Vector3(0, padH + 2.45, 0),
        baseColor,
      });
    });
  }

  private buildWalkingAgents() {
    this.departments.forEach((dept, idx) => {
      const root = new THREE.Group();
      const color = new THREE.Color(dept.color);
      const isCEO = dept.equipment === 'ceo';

      const suitMat = new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.15 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 });
      const skinMat = new THREE.MeshStandardMaterial({ color: isCEO ? '#fde68a' : '#f1f5f9', roughness: 0.35 });

      const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.34, 12);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.1, 0.17, 0);
      leftLeg.castShadow = true;
      root.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.1, 0.17, 0);
      rightLeg.castShadow = true;
      root.add(rightLeg);

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.46, 16), suitMat);
      torso.position.y = 0.56;
      torso.castShadow = true;
      root.add(torso);

      const armGeo = new THREE.CylinderGeometry(0.052, 0.048, 0.34, 10);
      const leftArm = new THREE.Group();
      leftArm.position.set(-0.26, 0.72, 0);
      const lMesh = new THREE.Mesh(armGeo, suitMat);
      lMesh.position.y = -0.15;
      leftArm.add(lMesh);
      root.add(leftArm);

      const rightArm = new THREE.Group();
      rightArm.position.set(0.26, 0.72, 0);
      const rMesh = new THREE.Mesh(armGeo, suitMat);
      rMesh.position.y = -0.15;
      rightArm.add(rMesh);
      root.add(rightArm);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 20), skinMat);
      head.position.y = 0.99;
      head.castShadow = true;
      root.add(head);

      if (isCEO) {
        const crown = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.11, 0.13, 6),
          new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#eab308', emissiveIntensity: 0.7, metalness: 0.85 })
        );
        crown.position.y = 1.24;
        root.add(crown);
      } else {
        const visor = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.07, 0.06),
          new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.3 })
        );
        visor.position.set(0, 1.0, 0.16);
        root.add(visor);
      }

      const statusLightMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2 });
      const statusLight = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), statusLightMat);
      statusLight.position.y = 1.35;
      root.add(statusLight);

      const taskMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.4 });
      const taskCube = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.26), taskMat);
      taskCube.position.set(0, 0.62, 0.36);
      taskCube.visible = false;
      root.add(taskCube);

      const coffeeCup = new THREE.Group();
      const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.048, 0.11, 10),
        new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 })
      );
      coffeeCup.add(mug);
      coffeeCup.position.set(0.25, 0.52, 0.2);
      coffeeCup.visible = false;
      root.add(coffeeCup);

      const init = this.snapshot.agents[idx];
      if (init) {
        root.position.set(init.x, isCEO ? 0.24 : 0.16, init.z);
        root.rotation.y = init.rotY;
      }

      this.scene.add(root);
      this.agentVisuals.push({
        root,
        leftLeg,
        rightLeg,
        leftArm,
        rightArm,
        taskCube,
        taskMat,
        coffeeCup,
        statusLightMat,
      });
    });
  }

  public updateSnapshot(next: SceneSnapshot) {
    this.snapshot = next;
    this.controls.autoRotate = next.autoOrbit;
  }

  public focusRoom(idx: number) {
    const pos = this.departments[idx]?.position;
    if (!pos) return;
    this.controls.target.set(pos[0] * 0.45, 0.5, pos[2] * 0.45);
  }

  public focusMeeting() {
    this.controls.target.set(MEETING_CENTER[0], 0.6, MEETING_CENTER[1]);
  }

  public focusLounge() {
    this.controls.target.set(LOUNGE_CENTER[0] * 0.55, 0.5, LOUNGE_CENTER[1] * 0.55);
  }

  public spawnCelebration(roomIdx: number) {
    const p = this.departments[roomIdx].position;
    const palette = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7'];
    const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    for (let i = 0; i < 52; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: palette[i % palette.length],
        emissive: palette[i % palette.length],
        emissiveIntensity: 0.75,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p[0], 2.0, p[2]);
      this.scene.add(mesh);
      this.confetti.push({
        mesh,
        vel: new THREE.Vector3((Math.random() - 0.5) * 5.5, 3.6 + Math.random() * 3, (Math.random() - 0.5) * 5.5),
        life: 2.2 + Math.random() * 0.8,
      });
    }
  }

  private handleResize = () => {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handlePointerDown = (e: PointerEvent) => {
    this.downPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - this.downPos.x, e.clientY - this.downPos.y) > 5) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.rooms.map((r) => r.hitMesh),
      false
    );
    if (hits.length > 0) {
      this.onSelectRoom(hits[0].object.userData.roomIdx as number);
    }
  };

  private animate = () => {
    this.rafId = requestAnimationFrame(this.animate);
    const dt = Math.min(0.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;

    this.controls.update();

    const { statuses, selectedIdx, agents, meetingActive, meetingSpeakerIdx } = this.snapshot;

    this.meetingStripMat.emissiveIntensity = meetingActive ? 1.4 + Math.sin(t * 5) * 0.35 : 0.45;
    this.meetingScreenMat.emissiveIntensity = meetingActive ? 0.95 : 0.45;

    this.rooms.forEach((room, idx) => {
      const st = statuses[idx];
      const activeCol =
        st === 'done'
          ? new THREE.Color('#22c55e')
          : st === 'error'
            ? new THREE.Color('#ef4444')
            : st === 'waiting'
              ? new THREE.Color('#f59e0b')
              : room.baseColor;

      room.stripMat.color.copy(activeCol);
      room.stripMat.emissive.copy(activeCol);
      room.stripMat.emissiveIntensity = st === 'running' || idx === selectedIdx ? 1.65 : 0.72;
      room.screenMat.emissiveIntensity = st === 'running' ? 0.85 + Math.sin(t * 7) * 0.2 : 0.52;
      room.haloMat.color.copy(activeCol);
      room.haloMat.opacity = st === 'running' ? 0.65 + Math.sin(t * 6) * 0.2 : idx === selectedIdx ? 0.45 : 0.16;
    });

    agents.forEach((ag, idx) => {
      const vis = this.agentVisuals[idx];
      if (!vis) return;

      const isWalking =
        ag.activity === 'walking_deliver' ||
        ag.activity === 'walking_lounge' ||
        ag.activity === 'walking_desk' ||
        ag.activity === 'walking_meeting';
      const isChilling = ag.activity === 'chilling';
      const isWorking = ag.activity === 'working';
      const isMeeting = ag.activity === 'meeting';
      const isSpeaking = isMeeting && meetingActive && meetingSpeakerIdx === idx;

      const inCEO = Math.abs(ag.x) < 2.6 && ag.z < -4.5;
      const inMeeting = Math.abs(ag.x) < 4.3 && Math.abs(ag.z - MEETING_CENTER[1]) < 2.3;
      const inLounge = Math.abs(ag.x - LOUNGE_CENTER[0]) < 3.2 && Math.abs(ag.z - LOUNGE_CENTER[1]) < 1.6;
      const inSideRoom = Math.abs(ag.x) > 7.2 || (ag.z > 4.6 && ag.x < -1.5);
      const baseY = inCEO ? 0.24 : inSideRoom ? 0.16 : inMeeting || inLounge ? 0.14 : 0.01;

      vis.root.position.x = ag.x;
      vis.root.position.z = ag.z;
      vis.root.rotation.y = ag.rotY;

      if (isWalking) {
        const stride = Math.sin(t * 12 + idx);
        vis.root.position.y = baseY + Math.abs(stride) * 0.07;
        vis.leftLeg.rotation.x = stride * 0.65;
        vis.rightLeg.rotation.x = -stride * 0.65;
        if (ag.carryingTask) {
          vis.leftArm.rotation.x = -1.05;
          vis.rightArm.rotation.x = -1.05;
        } else {
          vis.leftArm.rotation.x = -stride * 0.55;
          vis.rightArm.rotation.x = stride * 0.55;
        }
      } else if (isMeeting) {
        vis.root.position.y = baseY + (isSpeaking ? Math.abs(Math.sin(t * 7)) * 0.1 : Math.sin(t * 2 + idx) * 0.02);
        vis.leftLeg.rotation.x = 0;
        vis.rightLeg.rotation.x = 0;
        vis.leftArm.rotation.x = isSpeaking ? -1.1 + Math.sin(t * 10) * 0.35 : -0.35;
        vis.rightArm.rotation.x = isSpeaking ? -1.1 - Math.sin(t * 10) * 0.35 : -0.35;
      } else if (isWorking) {
        vis.root.position.y = baseY + Math.abs(Math.sin(t * 6 + idx)) * 0.04;
        vis.leftLeg.rotation.x = 0;
        vis.rightLeg.rotation.x = 0;
        vis.leftArm.rotation.x = -0.82 + Math.sin(t * 14 + idx) * 0.2;
        vis.rightArm.rotation.x = -0.82 - Math.sin(t * 14 + idx) * 0.2;
      } else if (isChilling) {
        vis.root.position.y = baseY + Math.sin(t * 2.2 + idx) * 0.025;
        vis.leftLeg.rotation.x = 0;
        vis.rightLeg.rotation.x = 0;
        vis.leftArm.rotation.x = -0.15;
        vis.rightArm.rotation.x = -0.75 + Math.sin(t * 2.2 + idx) * 0.12;
      } else {
        vis.root.position.y = baseY;
        vis.leftLeg.rotation.x = 0;
        vis.rightLeg.rotation.x = 0;
        vis.leftArm.rotation.x = 0;
        vis.rightArm.rotation.x = 0;
      }

      vis.taskCube.visible = ag.carryingTask;
      if (ag.carryingTask) {
        const taskCol = ag.carryingRework ? '#ef4444' : '#38bdf8';
        vis.taskMat.color.set(taskCol);
        vis.taskMat.emissive.set(taskCol);
        vis.taskCube.rotation.y += dt * 3.5;
      }
      vis.coffeeCup.visible = isChilling;

      const stCol = isSpeaking
        ? '#facc15'
        : isMeeting
          ? '#60a5fa'
          : isChilling
            ? '#fbbf24'
            : ag.carryingRework
              ? '#ef4444'
              : isWorking || ag.carryingTask
                ? '#38bdf8'
                : '#22c55e';
      vis.statusLightMat.color.set(stCol);
      vis.statusLightMat.emissive.set(stCol);
    });

    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.mesh.position.addScaledVector(c.vel, dt);
      c.vel.y -= 6.5 * dt;
      c.mesh.rotation.x += dt * 5;
      c.mesh.rotation.y += dt * 4;
      c.life -= dt;
      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        (c.mesh.material as THREE.Material).dispose();
        this.confetti.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const projected: ProjectedRoomLabel[] = this.rooms.map((room, idx) => {
      const worldPos = room.anchorLocal.clone().applyMatrix4(room.group.matrixWorld);
      worldPos.project(this.camera);
      return {
        idx,
        x: (worldPos.x * 0.5 + 0.5) * w,
        y: (-worldPos.y * 0.5 + 0.5) * h,
        visible: worldPos.z < 1,
      };
    });

    const mp = this.meetingAnchor.clone().project(this.camera);
    projected.push({
      idx: -2,
      x: (mp.x * 0.5 + 0.5) * w,
      y: (-mp.y * 0.5 + 0.5) * h,
      visible: mp.z < 1,
      isMeeting: true,
    });

    const lp = this.loungeAnchor.clone().project(this.camera);
    projected.push({
      idx: -1,
      x: (lp.x * 0.5 + 0.5) * w,
      y: (-lp.y * 0.5 + 0.5) * h,
      visible: lp.z < 1,
      isLounge: true,
    });

    this.onProjectLabels(projected);
  };

  public dispose() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.pmrem.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
