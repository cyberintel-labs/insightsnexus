/**
 * Data Processing Service
 * 
 * This service handles data processing, validation, and formatting for API responses.
 * It provides utilities for input validation, response formatting, and error handling.
 * 
 * Key Features:
 * - Input validation for API requests
 * - Response data formatting
 * - Error message formatting
 * - Data transformation utilities
 */

import dns from "dns";
import { promisify } from "util";
import axios from "axios";

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

/**
 * URL Validation
 * 
 * validateUrl(url: string): boolean
 * 
 * Validates URL format and structure.
 * 
 * Input:
 * - url: string - URL to validate
 * 
 * Returns:
 * - boolean - True if URL is valid, false otherwise
 * 
 * Process:
 * 1. Attempts to create URL object
 * 2. Validates hostname structure
 * 3. Checks for required domain and TLD components
 * 
 * Validation Rules:
 * - Must be a valid URL format
 * - Must include domain and TLD
 * - TLD must be at least 2 characters
 */
export function validateUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        const hostnameParts = urlObj.hostname.split('.');
        
        if (hostnameParts.length < 2) {
            return false;
        }
        
        if (hostnameParts.length < 2 || hostnameParts[hostnameParts.length - 1].length < 2) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * IP Address Validation
 * 
 * validateIpAddress(ip: string): boolean
 * 
 * Validates IP address format using regex pattern.
 * 
 * Input:
 * - ip: string - IP address to validate
 * 
 * Returns:
 * - boolean - True if IP is valid, false otherwise
 * 
 * Validation Rules:
 * - Must match IPv4 format (x.x.x.x)
 * - Each octet must be 0-255
 * - Must have exactly 4 octets
 */
export function validateIpAddress(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
}

/**
 * Domain Name Validation
 * 
 * validateDomain(domain: string): boolean
 * 
 * Validates domain name format and structure.
 * 
 * Input:
 * - domain: string - Domain name to validate
 * 
 * Returns:
 * - boolean - True if domain is valid, false otherwise
 * 
 * Validation Rules:
 * - Must contain at least one dot
 * - Must have valid characters
 * - Must not be empty
 */
export function validateDomain(domain: string): boolean {
    if (!domain || domain.trim() === "") {
        return false;
    }
    
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
}

/**
 * DNS Resolution
 * 
 * resolveDomain(domain: string): Promise<string[]>
 * 
 * Resolves domain names to IP addresses using DNS lookup.
 * 
 * Input:
 * - domain: string - Domain name to resolve
 * 
 * Returns:
 * - Promise<string[]> - Array of resolved IP addresses
 * 
 * Process:
 * 1. Resolves both IPv4 and IPv6 addresses
 * 2. Combines results into single array
 * 3. Handles errors gracefully
 * 
 * Error Handling:
 * - Returns empty array on resolution failure
 * - Logs errors for debugging
 */
export async function resolveDomain(domain: string): Promise<string[]> {
    try {
        const [ipv4Addresses, ipv6Addresses] = await Promise.all([
            resolve4(domain).catch(() => []),
            resolve6(domain).catch(() => [])
        ]);
        
        return [...ipv4Addresses, ...ipv6Addresses];
    } catch (error) {
        console.error("Error resolving domain:", error);
        return [];
    }
}

/**
 * DNS Records Retrieval
 * 
 * getDnsRecords(domain: string): Promise<{mx: string[], ns: string[], a: string[], cname: string[], txt: string[]}>
 * 
 * Retrieves comprehensive DNS information for a domain.
 * 
 * Input:
 * - domain: string - Domain name to query
 * 
 * Returns:
 * - Promise<{mx: string[], ns: string[], a: string[], cname: string[], txt: string[]}> - DNS records
 * 
 * Process:
 * 1. Queries multiple DNS record types
 * 2. Formats results consistently
 * 3. Handles missing records gracefully
 * 
 * Error Handling:
 * - Returns empty arrays for failed queries
 * - Logs errors for debugging
 */
export async function getDnsRecords(domain: string): Promise<{mx: string[], ns: string[], a: string[], cname: string[], txt: string[]}> {
    try {
        const [mxRecords, nsRecords, aRecords, cnameRecords, txtRecords] = await Promise.all([
            resolveMx(domain).catch(() => []),
            resolveNs(domain).catch(() => []),
            resolve4(domain).catch(() => []),
            resolveCname(domain).catch(() => []),
            resolveTxt(domain).catch(() => [])
        ]);

        return {
            mx: mxRecords.map(record => record.exchange),
            ns: nsRecords,
            a: aRecords,
            cname: cnameRecords,
            txt: txtRecords.flat()
        };
    } catch (error) {
        console.error("Error retrieving DNS records:", error);
        return {
            mx: [],
            ns: [],
            a: [],
            cname: [],
            txt: []
        };
    }
}

/**
 * Geolocation API Call
 * 
 * getGeolocation(ip: string): Promise<any>
 * 
 * Performs geolocation analysis on IP addresses using external API.
 * 
 * Input:
 * - ip: string - IP address to analyze
 * 
 * Returns:
 * - Promise<any> - Geolocation data from API
 * 
 * Process:
 * 1. Validates IP address format
 * 2. Makes HTTP request to geolocation API
 * 3. Returns structured location data
 * 
 * Error Handling:
 * - Throws error on API failure
 * - Validates IP format before API call
 */
export async function getGeolocation(ip: string): Promise<any> {
    if (!validateIpAddress(ip)) {
        throw new Error("Invalid IP address format");
    }

    const url = `https://free.freeipapi.com/api/json/${ip}`;
    const response = await axios.get(url);
    return response.data;
}

/**
 * Website Screenshot Capture
 * 
 * captureScreenshot(url: string): Promise<string>
 * 
 * Captures a visual snapshot of a website using Puppeteer.
 * 
 * Input:
 * - url: string - Website URL to capture
 * 
 * Returns:
 * - Promise<string> - Base64 encoded PNG image data
 * 
 * Process:
 * 1. Validates URL format
 * 2. Launches Puppeteer browser
 * 3. Navigates to URL and captures screenshot
 * 4. Converts to base64 format
 * 
 * Error Handling:
 * - Throws error on capture failure
 * - Validates URL before processing
 */
export async function captureScreenshot(url: string): Promise<string> {
    if (!validateUrl(url)) {
        throw new Error("Invalid URL format");
    }

    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        await page.setDefaultNavigationTimeout(30000);
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true
        });
        
        let base64Screenshot: string;
        if (screenshot instanceof Buffer) {
            base64Screenshot = screenshot.toString('base64');
        } else if (screenshot instanceof Uint8Array) {
            base64Screenshot = Buffer.from(screenshot).toString('base64');
        } else {
            throw new Error(`Unexpected screenshot type: ${typeof screenshot}`);
        }
        
        return base64Screenshot;
    } finally {
        await browser.close();
    }
}

/**
 * Error Response Formatter
 * 
 * formatErrorResponse(error: any, message?: string): {error: string}
 * 
 * Formats error responses consistently across the application.
 * 
 * Input:
 * - error: any - The error object or message
 * - message?: string - Optional custom error message
 * 
 * Returns:
 * - {error: string} - Formatted error response
 * 
 * Process:
 * 1. Extracts error message from error object
 * 2. Uses custom message if provided
 * 3. Returns consistent error format
 */
export function formatErrorResponse(error: any, message?: string): {error: string} {
    const errorMessage = message || (error instanceof Error ? error.message : String(error));
    return { error: errorMessage };
}

/**
 * Success Response Formatter
 * 
 * formatSuccessResponse(data: any, message?: string): any
 * 
 * Formats success responses consistently across the application.
 * 
 * Input:
 * - data: any - The response data
 * - message?: string - Optional success message
 * 
 * Returns:
 * - any - Formatted success response
 * 
 * Process:
 * 1. Adds success message if provided
 * 2. Returns data with consistent structure
 * 3. Maintains original data structure
 */
export function formatSuccessResponse(data: any, message?: string): any {
    if (message) {
        return { ...data, message };
    }
    return data;
}
