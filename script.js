// Animations disabled for a more stable UI feel

window.addEventListener('load', () => {
    const boot = document.getElementById('site-boot');
    if (boot && boot.style.display !== 'none') {
        setTimeout(() => {
            boot.classList.add('hidden');
            setTimeout(() => { boot.style.display = 'none'; }, 800);
        }, 2000);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const billingSwitch = document.getElementById('billing-switch');
    
    if (billingSwitch) {
        const monthlyLabel = document.getElementById('monthly-label');
        const yearlyLabel = document.getElementById('yearly-label');
        
        const basicPrice = document.getElementById('basic-price');
        const basicSubPrice = document.getElementById('basic-sub-price');
        const basicBadge = document.getElementById('basic-badge');
        const basicOriginalPrice = document.getElementById('basic-original-price');
        
        const proPrice = document.getElementById('pro-price');
        const proSubPrice = document.getElementById('pro-sub-price');
        const proBadge = document.getElementById('pro-badge');
        const proOriginalPrice = document.getElementById('pro-original-price');

        billingSwitch.addEventListener('change', (e) => {
            const isYearly = e.target.checked;
            
            if (isYearly) {
                // Yearly styling
                monthlyLabel.style.color = '#bbb';
                monthlyLabel.style.textShadow = 'none';
                yearlyLabel.style.color = 'var(--neon-cyan)';
                yearlyLabel.style.textShadow = '0 0 10px var(--neon-cyan)';
                
                // Basic Plan update
                basicOriginalPrice.style.display = 'inline';
                basicPrice.innerHTML = '$99.90<span>/yr</span>';
                basicSubPrice.innerHTML = 'or $9.99/mo';
                basicBadge.style.display = 'inline-block';
                basicBadge.textContent = '2 MONTHS FREE';
                
                // Pro Plan update
                proOriginalPrice.style.display = 'inline';
                proPrice.innerHTML = '$199.90<span>/yr</span>';
                proSubPrice.innerHTML = 'or $19.99/mo';
                proBadge.textContent = 'SAVE $40';
            } else {
                // Monthly styling
                yearlyLabel.style.color = '#bbb';
                yearlyLabel.style.textShadow = 'none';
                monthlyLabel.style.color = 'var(--neon-cyan)';
                monthlyLabel.style.textShadow = '0 0 10px var(--neon-cyan)';
                
                // Basic Plan update
                basicOriginalPrice.style.display = 'none';
                basicPrice.innerHTML = '$9.99<span>/mo</span>';
                basicSubPrice.innerHTML = 'or $99.90/yr';
                basicBadge.style.display = 'none';
                
                // Pro Plan update
                proOriginalPrice.style.display = 'none';
                proPrice.innerHTML = '$19.99<span>/mo</span>';
                proSubPrice.innerHTML = 'or $199.90/yr';
                proBadge.textContent = 'MOST POPULAR';
            }
        });
    }
});

// ==========================================
// FUSE VOID | OFFENSIVE CYBER SECURITY PROTOCOL
// Saldırganı Pişman Etme Modülü (V1)
// ==========================================
class SecurityManager {
    constructor() {
        this.fingerprint = this.getOrGenerateUUID();
        this.threatLevel = 0;
        this.initDefenses();
        console.log(`%c[FUSE VOID SECURITY] Monitor Active. UUID: ${this.fingerprint}`, 'color: #0ff; font-weight: bold;');
    }

    getOrGenerateUUID() {
        let uuid = localStorage.getItem('fv_uuid');
        if (!uuid) {
            uuid = 'fv_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('fv_uuid', uuid);
        }
        return uuid;
    }

    reportThreat(type) {
        this.threatLevel++;
        localStorage.setItem('fv_threat_level', this.threatLevel);
        
        console.log(`%c[THREAT DETECTED] Type: ${type} | UUID: ${this.fingerprint}`, 'color: #ff00ff; font-weight: bold; font-size: 14px;');
        console.log('%cWARNING: Unauthorised access attempt logged. IP and Fingerprint marked for Cloudflare Ban.', 'color: red; font-weight: bold;');
        
        // Future integration: Send this data to Cloudflare Workers to ban the IP
        // fetch('https://api.fusevoid.com/v1/security/report', { ... })
    }

    initDefenses() {
        // Prevent Right Click
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.reportThreat('RIGHT_CLICK_INSPECT');
        });

        // Prevent F12, Ctrl+Shift+I, Ctrl+U
        document.addEventListener('keydown', (e) => {
            if (
                e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.key === 'U')
            ) {
                e.preventDefault();
                this.reportThreat('DEV_TOOLS_SHORTCUT');
            }
        });
        
        // Trap for manual DevTools opening (detects screen resize when dock opens)
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: () => {
                this.reportThreat('DEV_TOOLS_OPENED');
                throw new Error("DevTools detected. Connection logged.");
            }
        });
        console.log('%c', element);
    }
}

// Initialize Security Protocol
new SecurityManager();

// ==========================================
// LIQUID GLASS UI (WebGL Pixel Distortion)
// ==========================================

const VERTEX_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision mediump float;

varying vec2 v_uv;
uniform vec2 u_mouse;        // Normalized mouse (0-1), Y inverted
uniform vec2 u_resolution;   // Canvas pixel size
uniform float u_time;         // Seconds
uniform float u_intensity;   // 0 = idle, 1 = active hover

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);

    // Ripple Displacement
    vec2 diff = (uv - u_mouse) * aspect;
    float dist = length(diff);

    // Concentric rings that decay with distance
    float wave = sin(dist * 40.0 - u_time * 4.0);
    float envelope = smoothstep(0.35, 0.0, dist);  // Fade out beyond 35% radius
    float ripple = wave * envelope * u_intensity * 0.012;

    // Displace UV radially from cursor
    vec2 displaced = uv + normalize(diff + 0.0001) * ripple;

    // Background Rendering
    // Dark base with subtle depth gradient
    vec3 col = mix(
        vec3(0.020, 0.020, 0.045),   // Deep dark blue
        vec3(0.035, 0.030, 0.060),   // Slightly lighter center
        1.0 - length(displaced - 0.5) * 0.8
    );

    // Subtle cyan vignette from center
    float vignette = 1.0 - length(displaced - 0.5) * 1.2;
    col += vec3(0.0, 0.12, 0.14) * vignette * 0.15;

    // Cyber grid lines
    vec2 grid = fract(displaced * 16.0);
    float line = smoothstep(0.97, 1.0, grid.x) + smoothstep(0.97, 1.0, grid.y);
    col += vec3(0.0, 0.6, 0.65) * line * 0.06;

    // Ripple highlight (bright ring at wave peaks)
    float highlight = abs(ripple) * 60.0;
    col += vec3(0.0, 0.85, 1.0) * highlight * u_intensity;

    // Ambient slow pulse (alive feel even without hover)
    float ambient = sin(u_time * 0.5) * 0.5 + 0.5;
    col += vec3(0.0, 0.04, 0.05) * ambient * 0.3;

    gl_FragColor = vec4(col, 1.0);
}
`;

class LiquidGlass {
    constructor(panel) {
        this.panel = panel;
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:inherit;pointer-events:none;z-index:0;';
        panel.prepend(this.canvas);

        this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: false });
        if (!this.gl) return;

        this.mouse = { x: 0.5, y: 0.5 };
        this.target = { x: 0.5, y: 0.5 };
        this.intensity = 0;
        this.targetIntensity = 0;
        this.time = 0;
        this.raf = null;

        this.initShaders();
        this.initGeometry();
        this.resize();
        this.bind();
        this.loop();
    }

    initShaders() {
        const gl = this.gl;
        const vs = this.compile(gl.VERTEX_SHADER, VERTEX_SRC);
        const fs = this.compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        gl.useProgram(this.program);

        this.loc = {
            mouse: gl.getUniformLocation(this.program, 'u_mouse'),
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            time: gl.getUniformLocation(this.program, 'u_time'),
            intensity: gl.getUniformLocation(this.program, 'u_intensity'),
        };
    }

    compile(type, src) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
    }

    initGeometry() {
        const gl = this.gl;
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,  1, -1,  -1, 1,
            -1,  1,  1, -1,   1, 1
        ]), gl.STATIC_DRAW);
        const pos = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    }

    resize() {
        const scale = 0.75;
        const rect = this.panel.getBoundingClientRect();
        this.canvas.width = rect.width * scale * (window.devicePixelRatio || 1);
        this.canvas.height = rect.height * scale * (window.devicePixelRatio || 1);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    bind() {
        this.panel.addEventListener('mousemove', (e) => {
            const r = this.panel.getBoundingClientRect();
            this.target.x = (e.clientX - r.left) / r.width;
            this.target.y = 1.0 - (e.clientY - r.top) / r.height;
            this.targetIntensity = 1.0;
        });
        this.panel.addEventListener('mouseleave', () => {
            this.targetIntensity = 0.0;
        });
        window.addEventListener('resize', () => this.resize());
    }

    loop() {
        const gl = this.gl;
        this.time += 0.016;

        this.mouse.x += (this.target.x - this.mouse.x) * 0.08;
        this.mouse.y += (this.target.y - this.mouse.y) * 0.08;
        this.intensity += (this.targetIntensity - this.intensity) * 0.06;

        gl.uniform2f(this.loc.mouse, this.mouse.x, this.mouse.y);
        gl.uniform2f(this.loc.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.loc.time, this.time);
        gl.uniform1f(this.loc.intensity, this.intensity);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        this.raf = requestAnimationFrame(() => this.loop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Disable WebGL Liquid Glass on touch devices for performance
    if (!('ontouchstart' in window)) {
        const panels = document.querySelectorAll('.glass-panel');
        panels.forEach(panel => {
            new LiquidGlass(panel);
            
            // Keep the Katman 1 3D tilt effect on the panel itself
            panel.addEventListener('mousemove', (e) => {
                const rect = panel.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const rx = (x / rect.width - 0.5) * 2;
                const ry = (y / rect.height - 0.5) * 2;
                const maxTilt = 3;
                panel.style.transform = `perspective(1000px) rotateY(${rx * maxTilt}deg) rotateX(${-ry * maxTilt}deg)`;
            });
            panel.addEventListener('mouseleave', () => {
                panel.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg)`;
            });
        });
    }
});
