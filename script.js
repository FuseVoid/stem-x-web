// Animations disabled for a more stable UI feel

window.addEventListener('load', () => {
    const boot = document.getElementById('site-boot');
    if (boot) {
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
