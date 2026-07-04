// Animations disabled for a more stable UI feel

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
