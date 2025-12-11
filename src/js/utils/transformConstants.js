/**
 * Transform Constants
 * 
 * This module contains constants used for transform configuration,
 * including duration estimates and progress strategies.
 * 
 * Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0)
 */

/**
 * Estimated Duration for Different Transforms
 * 
 * These estimates help provide more accurate progress indication:
 */
export const TRANSFORM_DURATIONS = {
    'sherlock': 45000,        // 45 seconds - searches 350+ platforms
    'port-scan': 25000,       // 25 seconds - scans 1000 ports
    'whois': 5000,            // 5 seconds - domain lookup
    'domain-to-ip': 3000,     // 3 seconds - DNS resolution
    'domain-to-dns': 3000,    // 3 seconds - DNS lookup
    'domain-to-endpoint': 4000, // 4 seconds - endpoint discovery
    'domain-to-subdomain': 30000, // 30 seconds - subdomain discovery
    'website-to-domain': 2000, // 2 seconds - URL parsing
    'website-screenshot': 8000, // 8 seconds - screenshot capture
    'ip-to-netblock': 4000,   // 4 seconds - netblock lookup
    'ip-to-location': 3000,   // 3 seconds - geolocation
    'run-custom-transform': 15000 // 15 seconds - custom Python transform
};

