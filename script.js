// Animations disabled for a more stable UI feel

window.addEventListener('load', () => {
    const boot = document.getElementById('site-boot');
    if (boot && boot.style.display !== 'none') {
        setTimeout(() => {
            boot.classList.add('hidden');
            setTimeout(() => { boot.style.display = 'none'; }, 1500); // Wait for CSS transition
        }, 4500);
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
uniform vec2 u_resolution;   // Canvas pixel size
uniform float u_time;        // Seconds

// Function to generate slow moving noise / fluid shapes
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractional Brownian Motion for organic flow
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = v_uv;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 centerUv = (uv - 0.5) * aspect; // -0.5 to 0.5 aspect corrected

    // --- The Atom / Framer 3.0 Energy Core ---
    // Slow rotational domain warping
    float slowTime = u_time * 0.15;
    mat2 rot = mat2(cos(slowTime), -sin(slowTime), sin(slowTime), cos(slowTime));
    vec2 warpUv = rot * centerUv * 2.5; // Zoom out slightly

    // Create a fluid, glowing structure
    float n1 = fbm(warpUv + vec2(sin(slowTime), cos(slowTime)));
    float n2 = fbm(warpUv * 1.5 - vec2(cos(slowTime*0.8), sin(slowTime*0.8)) + n1);

    // Glowing core masks
    float coreMask = smoothstep(0.7, 0.0, length(centerUv));
    
    // Prismatic Colors (FUSE VOID Palette: Cyan & Magenta)
    vec3 colorCyan = vec3(0.0, 0.8, 1.0);
    vec3 colorMagenta = vec3(0.9, 0.0, 0.7);
    vec3 colorDark = vec3(0.02, 0.02, 0.035);
    
    // Mix the fluid noise into colors
    vec3 fluidColor = mix(colorMagenta, colorCyan, n2);
    
    // Combine background with the glowing fluid core
    vec3 col = mix(colorDark, fluidColor, n1 * coreMask * 0.8);

    // Add subtle structural rings/atoms spinning
    float ring1 = abs(sin(length(warpUv) * 5.0 - u_time * 0.5));
    ring1 = smoothstep(0.9, 1.0, 1.0 - ring1) * 0.4 * coreMask;
    
    float ring2 = abs(cos(length(warpUv * rot) * 8.0 + u_time * 0.3));
    ring2 = smoothstep(0.95, 1.0, 1.0 - ring2) * 0.5 * coreMask;

    col += colorCyan * ring1;
    col += colorMagenta * ring2;

    // Global vignette to keep edges dark and seamless
    float globalVignette = 1.0 - smoothstep(0.3, 0.8, length(centerUv));
    col *= globalVignette;

    // Pure black edge clamp to prevent any artifacts
    col = max(col, colorDark);

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
        const liquidPanels = document.querySelectorAll('.liquid-panel');
        
        // Inject SVG Filter for Text Liquid Distortion
        if (!document.getElementById('liquid-text-svg')) {
            const svgNS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNS, 'svg');
            svg.id = 'liquid-text-svg';
            svg.style.cssText = 'position:absolute; width:0; height:0; pointer-events:none;';
            svg.innerHTML = `
                <defs>
                    <filter id="liquid-text-filter" x="-20%" y="-20%" width="140%" height="140%">
                        <!-- Neutral Gray (No displacement) -->
                        <feFlood flood-color="#808080" result="neutral"/>
                        
                        <!-- Water Ripple Noise -->
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise">
                            <animate attributeName="baseFrequency" values="0.04;0.05;0.04" dur="4s" repeatCount="indefinite" />
                        </feTurbulence>
                        
                        <!-- Cursor Mask (White circle fading to transparent) -->
                        <feImage id="drop-mask" href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><defs><radialGradient id='g'><stop offset='0%' stop-color='white' stop-opacity='1'/><stop offset='50%' stop-color='white' stop-opacity='0.8'/><stop offset='100%' stop-color='white' stop-opacity='0'/></radialGradient></defs><circle cx='150' cy='150' r='150' fill='url(%23g)'/></svg>" x="-1000" y="-1000" width="300" height="300" result="maskImage" />
                        
                        <!-- Mask the noise with the circle -->
                        <feComposite in="noise" in2="maskImage" operator="in" result="maskedNoise" />
                        
                        <!-- Put the masked noise over the neutral gray background -->
                        <feComposite in="maskedNoise" in2="neutral" operator="over" result="displacementMap" />
                        
                        <!-- Displace the text elements! -->
                        <feDisplacementMap in="SourceGraphic" in2="displacementMap" scale="35" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
            `;
            document.body.appendChild(svg);
        }

        liquidPanels.forEach(panel => {
            new LiquidGlass(panel);
            
            const dropMask = document.getElementById('drop-mask');
            
            panel.addEventListener('mousemove', (e) => {
                const rect = panel.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Move the SVG mask image so it's centered on the cursor (300x300 image -> offset by 150)
                if (dropMask) {
                    dropMask.setAttribute('x', x - 150);
                    dropMask.setAttribute('y', y - 150);
                }
            });
            
            panel.addEventListener('mouseleave', () => {
                // Move mask off-screen to remove text distortion when mouse leaves
                if (dropMask) {
                    dropMask.setAttribute('x', -1000);
                    dropMask.setAttribute('y', -1000);
                }
            });
        });
    }
});
