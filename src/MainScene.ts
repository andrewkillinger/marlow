import Phaser from 'phaser';
import { getSafeArea } from './ui/safe-area';

const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 320;
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

type Mode = 'place' | 'interact';
type ObjectType = 'dynamite' | 'seed' | 'ball' | 'bot' | 'spring' | 'magnet';
type MaterialType = 'sand' | 'dirt' | 'stone' | 'wood' | 'water' | 'oil' | 'lava' | 'fire' | 'steam' | 'smoke';
type Category = 'object' | 'material';

interface UIState {
  mode: Mode;
  category: Category;
  selectedObject: ObjectType;
  selectedMaterial: MaterialType;
}

interface GestureState {
  startDist?: number;
  startZoom?: number;
  lastMid?: Phaser.Math.Vector2;
}

type Button = Phaser.GameObjects.Container & {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
};

export default class MainScene extends Phaser.Scene {
  private gesture: GestureState = {};
  private ui: UIState = {
    mode: 'place',
    category: 'material',
    selectedObject: 'dynamite',
    selectedMaterial: 'sand'
  };

  private hud!: Phaser.GameObjects.Container;
  private modeButton!: Button;
  private objectButtons = new Map<ObjectType, Button>();
  private materialButtons = new Map<MaterialType, Button>();
  private materialRow!: Phaser.GameObjects.Container;

  constructor(){ super('Main'); }

  create(){
    const cam = this.cameras.main;
    cam.setZoom(3);
    cam.setRoundPixels(true);
    cam.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.game.canvas.style.imageRendering = 'pixelated';

    this.input.addPointer(2);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    this.createHUD();

    // no auto-spawn here; clean slate
  }

  private createHUD(){
    const insets = getSafeArea();
    const width = this.scale.width;
    const rowH = 56;
    const pad = 8;

    this.hud = this.add.container(0,0).setScrollFactor(0).setDepth(1000);

    this.modeButton = this.makeButton(width, rowH, 'Place', () => {
      this.ui.mode = this.ui.mode === 'place' ? 'interact' : 'place';
      this.updateModeButton();
    });
    this.modeButton.setPosition(0, insets.top);
    this.hud.add(this.modeButton);

    const objects: ObjectType[] = ['dynamite','seed','ball','bot','spring','magnet'];
    const objY = insets.top + rowH + pad;
    objects.forEach((obj, idx) => {
      const btn = this.makeButton(56, rowH, capitalize(obj), () => {
        this.ui.category = 'object';
        this.ui.selectedObject = obj;
        this.updateSelections();
      });
      btn.setPosition(idx * 56, objY);
      this.objectButtons.set(obj, btn);
      this.hud.add(btn);
    });

    const materials: MaterialType[] = ['sand','dirt','stone','wood','water','oil','lava','fire','steam','smoke'];
    const matY = objY + rowH + pad;
    this.materialRow = this.add.container(0, matY);
    this.materialRow.setScrollFactor(0);
    materials.forEach((mat, idx) => {
      const btn = this.makeButton(56, rowH, capitalize(mat), () => {
        this.ui.category = 'material';
        this.ui.selectedMaterial = mat;
        this.updateSelections();
      });
      btn.x = idx * 56;
      btn.y = 0;
      this.materialButtons.set(mat, btn);
      this.materialRow.add(btn);
    });
    this.enableMaterialScroll(width, materials.length * 56, rowH);
    const maskG = this.add.graphics().fillRect(0, matY, width, rowH);
    this.materialRow.setMask(maskG.createGeometryMask());
    this.hud.add(this.materialRow);

    this.updateSelections();
  }

  private enableMaterialScroll(viewW: number, contentW: number, rowH: number){
    const minX = Math.min(0, viewW - contentW);
    this.materialRow.setSize(viewW, rowH);
    this.materialRow.setInteractive(new Phaser.Geom.Rectangle(0,0,viewW,rowH), Phaser.Geom.Rectangle.Contains);
    let dragStart = 0;
    let rowStart = 0;
    this.materialRow.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      dragStart = pointer.x;
      rowStart = this.materialRow.x;
    });
    this.materialRow.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const dx = pointer.x - dragStart;
      this.materialRow.x = Phaser.Math.Clamp(rowStart + dx, minX, 0);
    });
    this.materialRow.on('pointerup', () => { dragStart = 0; });
    this.materialRow.on('pointerupoutside', () => { dragStart = 0; });
  }

  private makeButton(width: number, height: number, label: string, cb: () => void): Button {
    const bg = this.add.rectangle(0,0,width,height,0x000000,0.6).setOrigin(0);
    const text = this.add.text(width/2, height/2, label, {fontSize: '20px', color: '#fff'}).setOrigin(0.5);
    const container = this.add.container(0,0,[bg,text]) as Button;
    container.bg = bg;
    container.label = text;
    container.setSize(width,height);
    container.setInteractive(new Phaser.Geom.Rectangle(0,0,width,height), Phaser.Geom.Rectangle.Contains);
    container.on('pointerdown', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      container.setScale(0.95);
    });
    container.on('pointerup', (pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      container.setScale(1);
      cb();
    });
    container.on('pointerout', () => container.setScale(1));
    return container;
  }

  private updateModeButton(){
    this.modeButton.label.setText(this.ui.mode === 'place' ? 'Place' : 'Interact');
    this.modeButton.bg.setFillStyle(this.ui.mode === 'place' ? 0x00844d : 0x843500, 0.8);
  }

  private updateSelections(){
    this.objectButtons.forEach((btn, obj) => {
      const selected = this.ui.category === 'object' && this.ui.selectedObject === obj;
      btn.bg.setFillStyle(selected ? 0x555555 : 0x000000, selected ? 0.8 : 0.6);
    });
    this.materialButtons.forEach((btn, mat) => {
      const selected = this.ui.category === 'material' && this.ui.selectedMaterial === mat;
      btn.bg.setFillStyle(selected ? 0x555555 : 0x000000, selected ? 0.8 : 0.6);
    });
    this.updateModeButton();
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer){
    if (this.input.pointersTotal >= 2){
      const [p0, p1] = this.getActivePointers();
      const dist = Phaser.Math.Distance.Between(p0.x, p0.y, p1.x, p1.y);
      this.gesture.startDist = dist;
      this.gesture.startZoom = this.cameras.main.zoom;
      this.gesture.lastMid = new Phaser.Math.Vector2((p0.x+p1.x)/2, (p0.y+p1.y)/2);
      return;
    }
    if (pointer.event.cancelBubble) return;
    this.worldAction(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer){
    if (this.input.pointersTotal >= 2 && this.gesture.startDist){
      const cam = this.cameras.main;
      const [p0, p1] = this.getActivePointers();
      const dist = Phaser.Math.Distance.Between(p0.x, p0.y, p1.x, p1.y);
      const scale = dist / this.gesture.startDist;
      const zoom = Phaser.Math.Clamp((this.gesture.startZoom || cam.zoom) * scale, MIN_ZOOM, MAX_ZOOM);
      cam.setZoom(zoom);
      const mid = new Phaser.Math.Vector2((p0.x+p1.x)/2, (p0.y+p1.y)/2);
      const dx = (mid.x - (this.gesture.lastMid?.x || mid.x)) / zoom;
      const dy = (mid.y - (this.gesture.lastMid?.y || mid.y)) / zoom;
      cam.scrollX -= dx;
      cam.scrollY -= dy;
      this.gesture.lastMid = mid;
      cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, WORLD_WIDTH - cam.width / zoom);
      cam.scrollY = Phaser.Math.Clamp(cam.scrollY, 0, WORLD_HEIGHT - cam.height / zoom);
      return;
    }
    if (pointer.isDown && !pointer.event.cancelBubble) this.worldAction(pointer);
  }

  private handlePointerUp(){
    if (this.input.pointersTotal < 2){
      this.gesture = {};
    }
  }

  private worldAction(pointer: Phaser.Input.Pointer){
    const cam = this.cameras.main;
    const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
    const x = Phaser.Math.Clamp(worldPoint.x, 0, WORLD_WIDTH);
    const y = Phaser.Math.Clamp(worldPoint.y, 0, WORLD_HEIGHT);

    if (this.ui.mode === 'place'){
      if (this.ui.category === 'object') this.placeObjectAt(x,y,this.ui.selectedObject);
      else this.placeMaterialAt(x,y,this.ui.selectedMaterial);
    } else {
      this.interactAt(x,y);
    }
  }

  private placeMaterialAt(x:number, y:number, material: MaterialType){
    const colors: Record<MaterialType, number> = {
      sand: 0xC2B280,
      dirt: 0x8B4513,
      stone: 0x808080,
      wood: 0xA0522D,
      water: 0x1E90FF,
      oil: 0x333333,
      lava: 0xFF4500,
      fire: 0xFF8C00,
      steam: 0xF0FFFF,
      smoke: 0x696969
    };
    this.add.rectangle(x, y, 4, 4, colors[material]).setOrigin(0.5).setDepth(10);
  }

  private placeObjectAt(x:number, y:number, type: ObjectType){
    this.add.circle(x, y, 6, 0xffffff).setDepth(10);
  }

  private interactAt(x:number, y:number){
    console.log('interact at', x, y);
  }

  private getActivePointers(): Phaser.Input.Pointer[]{
    return this.input.pointers.filter(p => p.isDown).slice(0,2);
  }
}

function capitalize(str: string){
  return str.charAt(0).toUpperCase() + str.slice(1);
}
