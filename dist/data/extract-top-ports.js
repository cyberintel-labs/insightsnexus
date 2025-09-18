const https = require('https');
const fs = require('fs');

// Download port services file and extract top 1000 ports by frequency
https.get('https://raw.githubusercontent.com/nmap/nmap/master/nmap-services', (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        const lines = data.split('\n');
        const ports = [];
        
        for (const line of lines) {
            if (line.startsWith('#') || !line.trim()) continue;
            
            const parts = line.trim().split(/\s+/);
            if (parts.length < 3) continue;
            
            const portProto = parts[1];
            const frequency = parseFloat(parts[2]);
            
            if (isNaN(frequency) || frequency <= 0) continue;
            
            const port = parseInt(portProto.split('/')[0]);
            if (isNaN(port) || port <= 0 || port > 65535) continue;
            
            ports.push({ port, frequency });
        }
        
        // Sort by frequency (descending) and take top 1000
        ports.sort((a, b) => b.frequency - a.frequency);
        const top1000 = ports.slice(0, 1000).map(p => p.port);
        
        // Write to file
        const output = top1000.join('\n');
        fs.writeFileSync('top-1000-ports.txt', output);
        
        console.log(`Extracted ${top1000.length} ports`);
        console.log('Top 10 ports:', top1000.slice(0, 10));
    });
}).on('error', (err) => {
    console.error('Error downloading port services:', err);
});
