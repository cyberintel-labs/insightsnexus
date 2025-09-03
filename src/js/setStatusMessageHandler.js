export function setStatusMessage(message) {
    const bar = document.getElementById('status-bar');
    bar.textContent = message;
    bar.style.display = 'block';
    clearTimeout(bar._timeout);
    bar._timeout = setTimeout(() => bar.style.display = 'none', 4000);
}