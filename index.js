/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');

const WIDTH = 500;
const HEIGHT = 500;
const BACKGROUND_COLOR = '#0a0a0a';
const FOREGROUND_COLOR = '#497863';

canvas.width = WIDTH;
canvas.height = HEIGHT;

const ctx = canvas.getContext('2d');

/** @type {HTMLInputElement} */
const rotateXZInput = document.getElementById('rotate-xz');
/** @type {HTMLSpanElement} */
const rotateXZDegreeLabel = document.getElementById('rotate-xz-degree-label');
/** @type {HTMLInputElement} */
const animateXZInput = document.getElementById('animate-xz');

/** @type {HTMLInputElement} */
const rotateYZInput = document.getElementById('rotate-yz');
/** @type {HTMLSpanElement} */
const rotateYZDegreeLabel = document.getElementById('rotate-yz-degree-label');
/** @type {HTMLInputElement} */
const animateYZInput = document.getElementById('animate-yz');

/** @type {HTMLInputElement} */
const rotateXYInput = document.getElementById('rotate-xy');
/** @type {HTMLSpanElement} */
const rotateXYDegreeLabel = document.getElementById('rotate-xy-degree-label');
/** @type {HTMLInputElement} */
const animateXYInput = document.getElementById('animate-xy');

/** @type {HTMLInputElement} */
const runInput = document.getElementById('run');

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 *   z: number,
 * }} Vec3
 */

/**
 * @typedef {{
 *   x: number,
 *   y: number,
 * }} Vec2
 */

/**
 * @type {Vec3[]}
 */
const ps = [
    { x: -0.5, y: 0.5, z: -0.5 },
    { x: 0.5, y: 0.5, z: -0.5 },
    { x: 0.5, y: -0.5, z: -0.5 },
    { x: -0.5, y: -0.5, z: -0.5 },

    { x: -0.5, y: 0.5, z: 0.5 },
    { x: 0.5, y: 0.5, z: 0.5 },
    { x: 0.5, y: -0.5, z: 0.5 },
    { x: -0.5, y: -0.5, z: 0.5 },
];

const fs = [
    [0, 1, 2, 3],
    [4, 5, 6, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
];

/**
 * @param {Vec2} point
 */
function point({ x, y }) {
    const size = 10;
    ctx.fillStyle = FOREGROUND_COLOR;
    ctx.fillRect(x - (size / 2), y - (size / 2), size, size);
}

/**
 * @param {Vec2} point1
 * @param {Vec2} point2
 */
function line({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    ctx.strokeStyle = FOREGROUND_COLOR;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

/**
 * @param {Vec2} point
 * @returns {Vec2}
 */
function screen({ x, y }) {
    return {
        x: ((x + 1) / 2) * WIDTH,
        y: ((y + 1) / 2) * HEIGHT,
    };
}

/**
 * @param {Vec3} point
 * @returns {Vec2}
 */
function project({ x, y, z }) {
    const zp = z + 2;
    return {
        x: x / zp,
        y: y / zp,
    };
}

/**
 * @param {Vec3} point
 * @param {Vec3} angle
 * @returns {Vec3}
 */
function rotateYZ({ x, y, z }, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x,
        y: y * cos - z * sin,
        z: y * sin + z * cos,
    };
}

/**
 * @param {Vec3} point
 * @param {number} angle
 * @returns {Vec3}
 */
function rotateXZ({ x, y, z }, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: x * cos - z * sin,
        y,
        z: x * sin + z * cos,
    };
}

/**
 * @param {Vec3} point
 * @param {Vec3} angle
 * @returns {Vec3}
 */
function rotateXY({ x, y, z }, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: x * cos - y * sin,
        y: x * sin + y * cos,
        z,
    };
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

/**
 * @param {number} delta
 */
function draw() {
    clear();
    const dYZ = rotateYZInput.value;
    const dXZ = rotateXZInput.value;
    const dXY = rotateXYInput.value;
    const renderPS = ps.map(
        (p) => screen(project(rotateXY(rotateXZ(rotateYZ(p, dYZ), dXZ), dXY)))
    );
    /** @type {Set<string>} */
    const done = new Set();
    for (const f of fs) {
        for (let i = 0; i < f.length; i++) {
            const first = f[i];
            const second = f[(i + 1) % f.length];
            const key = [first, second].sort().join(':');
            if (done.has(key)) continue;
            line(renderPS[first], renderPS[second]);
            done.add(key);
        }
    }
}

/**
 * @param {HTMLSpanElement} label
 */
function updateRotationInputUI(value, label) {
    const degree = value * (180 / Math.PI);
    label.innerText = degree.toFixed(0);
}

/**
 * @param {HTMLInputElement} input
 * @param {HTMLSpanElement} label
 */
function setupRotationInput(input, label) {
    input.min = 0;
    input.max = 2 * Math.PI;
    input.step = Math.PI / 180;

    input.addEventListener("input", function() {
        updateRotationInputUI(input.value, label);
        draw();
    });
}

setupRotationInput(rotateXZInput, rotateXZDegreeLabel, animateXZInput);
setupRotationInput(rotateYZInput, rotateYZDegreeLabel, animateYZInput);
setupRotationInput(rotateXYInput, rotateXYDegreeLabel, animateXYInput);

/**
 * @param {HTMLInputElement} input
 * @param {number} delta
 */
function stepInputValue(input, delta) {
    let newValue =
        parseFloat(input.value)
        + (parseFloat(input.step) * (delta / 15));
    if (newValue.toFixed(2) >= parseFloat(input.max).toFixed(2)) {
        newValue = input.min;
    }
    input.value = newValue;
}

let lastTime = 0;

/**
 * @param {number} time
 */
function animate(time) {
    const delta = time - lastTime;
    lastTime = time;
    if (!runInput.checked) {
        requestAnimationFrame(animate);
        return;
    }
    if (animateXZInput.checked) {
        stepInputValue(rotateXZInput, delta);
        updateRotationInputUI(rotateXZInput.value, rotateXZDegreeLabel);
    }
    if (animateYZInput.checked) {
        stepInputValue(rotateYZInput, delta);
        updateRotationInputUI(rotateYZInput.value, rotateYZDegreeLabel);
    }
    if (animateXYInput.checked) {
        stepInputValue(rotateXYInput, delta);
        updateRotationInputUI(rotateXYInput.value, rotateXYDegreeLabel);
    }
    draw();
    requestAnimationFrame(animate);
}

draw();
requestAnimationFrame(animate);
