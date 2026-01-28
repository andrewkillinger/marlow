/**
 * Simple icon generator for Marlow's Lemonade Stand
 * Creates PNG icons at various sizes using canvas
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if canvas is available (optional dependency)
let createCanvas = null;
try {
    const canvas = await import('canvas');
    createCanvas = canvas.default?.createCanvas || canvas.createCanvas;
} catch (e) {
    console.log('Canvas module not available, creating placeholder icons');
}

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUTPUT_DIR = join(__dirname, '..', 'icons');

function drawLemonIcon(ctx, size) {
    const scale = size / 512;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, size);
    bgGrad.addColorStop(0, '#87CEEB');
    bgGrad.addColorStop(1, '#FFD93D');

    // Rounded rect background
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    const radius = 80 * scale;
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.fill();

    // Lemon body
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.ellipse(256 * scale, 260 * scale, 140 * scale, 120 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F0C800';
    ctx.lineWidth = 8 * scale;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = 'rgba(255, 248, 220, 0.6)';
    ctx.beginPath();
    ctx.ellipse(220 * scale, 230 * scale, 40 * scale, 30 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leaves
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(240 * scale, 145 * scale, 25 * scale, 40 * scale, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(275 * scale, 140 * scale, 20 * scale, 35 * scale, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(252 * scale, 125 * scale, 12 * scale, 30 * scale);

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(210 * scale, 260 * scale, 20 * scale, 25 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(302 * scale, 260 * scale, 20 * scale, 25 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.ellipse(215 * scale, 255 * scale, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(307 * scale, 255 * scale, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 10 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(200 * scale, 310 * scale);
    ctx.quadraticCurveTo(256 * scale, 360 * scale, 312 * scale, 310 * scale);
    ctx.stroke();

    // Cheeks
    ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
    ctx.beginPath();
    ctx.ellipse(170 * scale, 295 * scale, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(342 * scale, 295 * scale, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Text "M" for smaller icons
    if (size <= 144) {
        ctx.fillStyle = '#8B4513';
        ctx.font = `bold ${80 * scale}px "Comic Sans MS", cursive, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 256 * scale, 420 * scale);
    } else {
        ctx.fillStyle = '#8B4513';
        ctx.font = `bold ${48 * scale}px "Comic Sans MS", cursive, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText("MARLOW'S", 256 * scale, 440 * scale);
    }
}

function generateIcons() {
    if (!existsSync(OUTPUT_DIR)) {
        mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    if (createCanvas) {
        console.log('Generating PNG icons with canvas...');

        for (const size of SIZES) {
            const canvas = createCanvas(size, size);
            const ctx = canvas.getContext('2d');

            drawLemonIcon(ctx, size);

            const buffer = canvas.toBuffer('image/png');
            const outputPath = join(OUTPUT_DIR, `icon-${size}.png`);
            writeFileSync(outputPath, buffer);
            console.log(`Created: icon-${size}.png`);
        }
    } else {
        // Create minimal 1x1 placeholder PNGs for each size
        // This is a valid 1x1 yellow PNG
        const yellowPixelPNG = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
            0x00, 0x01, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
            0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);

        console.log('Creating placeholder icons (install canvas for full icons)...');

        for (const size of SIZES) {
            const outputPath = join(OUTPUT_DIR, `icon-${size}.png`);
            writeFileSync(outputPath, yellowPixelPNG);
            console.log(`Created placeholder: icon-${size}.png`);
        }
    }

    console.log('Icon generation complete!');
}

generateIcons();
