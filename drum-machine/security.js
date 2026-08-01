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
