document.addEventListener('mousemove', (e) => {
    const panel = document.querySelector('.glass-panel');
    const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
    
    panel.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

// Reset transform on mouse leave
document.addEventListener('mouseleave', () => {
    const panel = document.querySelector('.glass-panel');
    panel.style.transform = `rotateY(0deg) rotateX(0deg)`;
    panel.style.transition = 'transform 0.5s ease';
});

// Remove transition when moving
document.addEventListener('mouseenter', () => {
    const panel = document.querySelector('.glass-panel');
    panel.style.transition = 'none';
});
