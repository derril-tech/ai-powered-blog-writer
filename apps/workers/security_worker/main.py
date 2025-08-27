#!/usr/bin/env python3
"""
Security Worker for AI Blog Writer

Handles:
- Dependency vulnerability scanning
- Container image scanning
- Security policy enforcement
- Signed URL generation and validation
- RLS policy management
"""

import os
import json
import asyncio
import logging
import subprocess
import tempfile
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import hashlib
import hmac
import base64
import urllib.parse

import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import requests
from packaging import version

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Vulnerability:
    """Represents a security vulnerability"""
    id: str
    package_name: str
    package_version: str
    vulnerability_id: str
    severity: str
    title: str
    description: str
    cve_id: Optional[str]
    cvss_score: float
    affected_versions: List[str]
    fixed_versions: List[str]
    published_date: str
    last_updated: str
    status: str
    remediation: str
    references: List[str]

@dataclass
class SecurityScan:
    """Represents a security scan result"""
    id: str
    type: str
    status: str
    started_at: str
    completed_at: Optional[str]
    vulnerabilities_found: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    scan_config: Dict[str, Any]
    results_summary: str

@dataclass
class RLSRule:
    """Represents a Row Level Security rule"""
    id: str
    name: str
    table: str
    policy: str
    roles: List[str]
    conditions: str
    status: str
    created_at: str
    updated_at: str
    created_by: str
    description: str

@dataclass
class SignedURL:
    """Represents a signed URL"""
    id: str
    url: str
    resource_type: str
    resource_id: str
    expires_at: str
    created_at: str
    created_by: str
    access_count: int
    max_accesses: int
    status: str
    permissions: List[str]

class SecurityWorker:
    """Main security worker class"""
    
    def __init__(self):
        """Initialize the security worker"""
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'ai_blog_writer'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'password')
        }
        
        self.redis_client = redis.Redis(
            host=os.getenv('REDIS_HOST', 'localhost'),
            port=int(os.getenv('REDIS_PORT', '6379')),
            db=0,
            decode_responses=True
        )
        
        self.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')
        self.base_url = os.getenv('BASE_URL', 'https://storage.example.com')
        
        # Security scan APIs
        self.nvd_api_key = os.getenv('NVD_API_KEY')
        self.trivy_path = os.getenv('TRIVY_PATH', 'trivy')
        
    def get_db_connection(self):
        """Get database connection"""
        return psycopg2.connect(**self.db_config)
    
    async def scan_dependencies(self, project_path: str, include_dev: bool = False) -> SecurityScan:
        """
        Scan project dependencies for vulnerabilities
        
        Args:
            project_path: Path to the project directory
            include_dev: Whether to include dev dependencies
            
        Returns:
            SecurityScan object with results
        """
        logger.info(f"Starting dependency scan for {project_path}")
        
        scan_id = f"dep_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        started_at = datetime.now().isoformat()
        
        try:
            # Check if package.json exists
            package_json_path = os.path.join(project_path, 'package.json')
            if not os.path.exists(package_json_path):
                raise FileNotFoundError("package.json not found")
            
            # Read package.json
            with open(package_json_path, 'r') as f:
                package_data = json.load(f)
            
            dependencies = {}
            if include_dev:
                dependencies.update(package_data.get('devDependencies', {}))
            dependencies.update(package_data.get('dependencies', {}))
            
            vulnerabilities = []
            critical_count = 0
            high_count = 0
            medium_count = 0
            low_count = 0
            
            # Check each dependency for vulnerabilities
            for package_name, package_version in dependencies.items():
                package_vulns = await self._check_package_vulnerabilities(package_name, package_version)
                vulnerabilities.extend(package_vulns)
                
                for vuln in package_vulns:
                    if vuln.severity == 'critical':
                        critical_count += 1
                    elif vuln.severity == 'high':
                        high_count += 1
                    elif vuln.severity == 'medium':
                        medium_count += 1
                    elif vuln.severity == 'low':
                        low_count += 1
            
            completed_at = datetime.now().isoformat()
            
            scan = SecurityScan(
                id=scan_id,
                type='dependency',
                status='completed',
                started_at=started_at,
                completed_at=completed_at,
                vulnerabilities_found=len(vulnerabilities),
                critical_count=critical_count,
                high_count=high_count,
                medium_count=medium_count,
                low_count=low_count,
                scan_config={
                    'include_dev_dependencies': include_dev,
                    'fail_on_severity': 'high'
                },
                results_summary=f"Found {len(vulnerabilities)} vulnerabilities: {critical_count} critical, {high_count} high, {medium_count} medium, {low_count} low"
            )
            
            # Save scan results to database
            await self._save_security_scan(scan)
            
            # Save vulnerabilities to database
            for vuln in vulnerabilities:
                await self._save_vulnerability(vuln)
            
            logger.info(f"Dependency scan completed: {scan.results_summary}")
            return scan
            
        except Exception as e:
            logger.error(f"Dependency scan failed: {str(e)}")
            return SecurityScan(
                id=scan_id,
                type='dependency',
                status='failed',
                started_at=started_at,
                completed_at=datetime.now().isoformat(),
                vulnerabilities_found=0,
                critical_count=0,
                high_count=0,
                medium_count=0,
                low_count=0,
                scan_config={'include_dev_dependencies': include_dev},
                results_summary=f"Scan failed: {str(e)}"
            )
    
    async def scan_container_image(self, image_name: str, registry: str = 'docker.io') -> SecurityScan:
        """
        Scan container image for vulnerabilities using Trivy
        
        Args:
            image_name: Name of the container image
            registry: Container registry
            
        Returns:
            SecurityScan object with results
        """
        logger.info(f"Starting container scan for {registry}/{image_name}")
        
        scan_id = f"container_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        started_at = datetime.now().isoformat()
        
        try:
            # Use Trivy to scan the image
            full_image_name = f"{registry}/{image_name}"
            
            # Run Trivy scan
            result = subprocess.run([
                self.trivy_path,
                'image',
                '--format', 'json',
                '--severity', 'CRITICAL,HIGH,MEDIUM,LOW',
                full_image_name
            ], capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                raise Exception(f"Trivy scan failed: {result.stderr}")
            
            # Parse Trivy results
            trivy_results = json.loads(result.stdout)
            
            vulnerabilities = []
            critical_count = 0
            high_count = 0
            medium_count = 0
            low_count = 0
            
            # Process vulnerabilities from Trivy
            for result_data in trivy_results.get('Results', []):
                for vuln in result_data.get('Vulnerabilities', []):
                    severity = vuln.get('Severity', 'UNKNOWN').lower()
                    
                    if severity == 'critical':
                        critical_count += 1
                    elif severity == 'high':
                        high_count += 1
                    elif severity == 'medium':
                        medium_count += 1
                    elif severity == 'low':
                        low_count += 1
                    
                    # Create vulnerability object
                    vulnerability = Vulnerability(
                        id=f"vuln_{hashlib.md5(f"{vuln.get('VulnerabilityID', '')}{vuln.get('PkgName', '')}".encode()).hexdigest()}",
                        package_name=vuln.get('PkgName', ''),
                        package_version=vuln.get('InstalledVersion', ''),
                        vulnerability_id=vuln.get('VulnerabilityID', ''),
                        severity=severity,
                        title=vuln.get('Title', ''),
                        description=vuln.get('Description', ''),
                        cve_id=vuln.get('VulnerabilityID'),
                        cvss_score=float(vuln.get('CVSS', {}).get('nvd', {}).get('V3Score', 0)),
                        affected_versions=[vuln.get('InstalledVersion', '')],
                        fixed_versions=[vuln.get('FixedVersion', '')] if vuln.get('FixedVersion') else [],
                        published_date=datetime.now().isoformat(),
                        last_updated=datetime.now().isoformat(),
                        status='open',
                        remediation=f"Update to version {vuln.get('FixedVersion', 'latest')}" if vuln.get('FixedVersion') else "No fix available",
                        references=vuln.get('References', [])
                    )
                    vulnerabilities.append(vulnerability)
            
            completed_at = datetime.now().isoformat()
            
            scan = SecurityScan(
                id=scan_id,
                type='container',
                status='completed',
                started_at=started_at,
                completed_at=completed_at,
                vulnerabilities_found=len(vulnerabilities),
                critical_count=critical_count,
                high_count=high_count,
                medium_count=medium_count,
                low_count=low_count,
                scan_config={
                    'image_name': image_name,
                    'registry': registry
                },
                results_summary=f"Found {len(vulnerabilities)} vulnerabilities: {critical_count} critical, {high_count} high, {medium_count} medium, {low_count} low"
            )
            
            # Save scan results to database
            await self._save_security_scan(scan)
            
            # Save vulnerabilities to database
            for vuln in vulnerabilities:
                await self._save_vulnerability(vuln)
            
            logger.info(f"Container scan completed: {scan.results_summary}")
            return scan
            
        except Exception as e:
            logger.error(f"Container scan failed: {str(e)}")
            return SecurityScan(
                id=scan_id,
                type='container',
                status='failed',
                started_at=started_at,
                completed_at=datetime.now().isoformat(),
                vulnerabilities_found=0,
                critical_count=0,
                high_count=0,
                medium_count=0,
                low_count=0,
                scan_config={'image_name': image_name, 'registry': registry},
                results_summary=f"Scan failed: {str(e)}"
            )
    
    async def _check_package_vulnerabilities(self, package_name: str, package_version: str) -> List[Vulnerability]:
        """
        Check a specific package for vulnerabilities using NVD API
        
        Args:
            package_name: Name of the package
            package_version: Version of the package
            
        Returns:
            List of vulnerabilities found
        """
        vulnerabilities = []
        
        try:
            # Query NVD API for vulnerabilities
            if self.nvd_api_key:
                headers = {'apiKey': self.nvd_api_key}
            else:
                headers = {}
            
            # Search for vulnerabilities related to this package
            url = f"https://services.nvd.nist.gov/rest/json/cves/2.0"
            params = {
                'keyword': package_name,
                'resultsPerPage': 20
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            for vuln_data in data.get('vulnerabilities', []):
                cve = vuln_data.get('cve', {})
                
                # Check if this vulnerability affects our package version
                if self._is_version_affected(package_version, cve):
                    # Parse CVSS score
                    cvss_score = 0.0
                    if 'metrics' in cve and 'cvssMetricV31' in cve['metrics']:
                        cvss_score = float(cve['metrics']['cvssMetricV31'][0]['cvssData']['baseScore'])
                    elif 'metrics' in cve and 'cvssMetricV30' in cve['metrics']:
                        cvss_score = float(cve['metrics']['cvssMetricV30'][0]['cvssData']['baseScore'])
                    
                    # Determine severity based on CVSS score
                    if cvss_score >= 9.0:
                        severity = 'critical'
                    elif cvss_score >= 7.0:
                        severity = 'high'
                    elif cvss_score >= 4.0:
                        severity = 'medium'
                    else:
                        severity = 'low'
                    
                    vulnerability = Vulnerability(
                        id=f"vuln_{cve.get('id', '')}",
                        package_name=package_name,
                        package_version=package_version,
                        vulnerability_id=cve.get('id', ''),
                        severity=severity,
                        title=cve.get('descriptions', [{}])[0].get('value', ''),
                        description=cve.get('descriptions', [{}])[0].get('value', ''),
                        cve_id=cve.get('id'),
                        cvss_score=cvss_score,
                        affected_versions=[package_version],
                        fixed_versions=[],  # Would need to parse from references
                        published_date=cve.get('published', ''),
                        last_updated=cve.get('lastModified', ''),
                        status='open',
                        remediation=f"Update {package_name} to a patched version",
                        references=[ref.get('url', '') for ref in cve.get('references', [])]
                    )
                    vulnerabilities.append(vulnerability)
            
        except Exception as e:
            logger.error(f"Error checking vulnerabilities for {package_name}: {str(e)}")
        
        return vulnerabilities
    
    def _is_version_affected(self, package_version: str, cve_data: Dict) -> bool:
        """
        Check if a package version is affected by a CVE
        
        Args:
            package_version: Version to check
            cve_data: CVE data from NVD API
            
        Returns:
            True if version is affected
        """
        try:
            # This is a simplified check - in practice, you'd need to parse
            # the CVE configuration and check version ranges
            return True
        except Exception:
            return False
    
    async def create_signed_url(self, resource_type: str, resource_id: str, 
                               expires_in_hours: int = 24, max_accesses: int = 1,
                               permissions: List[str] = None) -> SignedURL:
        """
        Create a signed URL for secure resource access
        
        Args:
            resource_type: Type of resource (image, document, export, backup)
            resource_id: ID of the resource
            expires_in_hours: Hours until URL expires
            max_accesses: Maximum number of times URL can be accessed
            permissions: List of permissions (read, write, delete)
            
        Returns:
            SignedURL object
        """
        if permissions is None:
            permissions = ['read']
        
        # Generate expiration timestamp
        expires_at = datetime.now() + timedelta(hours=expires_in_hours)
        
        # Create URL path
        path = f"/{resource_type}/{resource_id}"
        
        # Create signature
        signature_data = f"{path}:{expires_at.timestamp()}:{','.join(permissions)}"
        signature = hmac.new(
            self.secret_key.encode(),
            signature_data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Build signed URL
        params = {
            'signature': signature,
            'expires': int(expires_at.timestamp()),
            'permissions': ','.join(permissions)
        }
        
        url = f"{self.base_url}{path}?{urllib.parse.urlencode(params)}"
        
        signed_url = SignedURL(
            id=f"url_{hashlib.md5(url.encode()).hexdigest()}",
            url=url,
            resource_type=resource_type,
            resource_id=resource_id,
            expires_at=expires_at.isoformat(),
            created_at=datetime.now().isoformat(),
            created_by='system',
            access_count=0,
            max_accesses=max_accesses,
            status='active',
            permissions=permissions
        )
        
        # Save to database
        await self._save_signed_url(signed_url)
        
        logger.info(f"Created signed URL for {resource_type}/{resource_id}")
        return signed_url
    
    async def validate_signed_url(self, url: str) -> bool:
        """
        Validate a signed URL
        
        Args:
            url: The signed URL to validate
            
        Returns:
            True if URL is valid
        """
        try:
            parsed = urllib.parse.urlparse(url)
            params = urllib.parse.parse_qs(parsed.query)
            
            signature = params.get('signature', [''])[0]
            expires = int(params.get('expires', ['0'])[0])
            permissions = params.get('permissions', [''])[0].split(',')
            
            # Check if expired
            if datetime.now().timestamp() > expires:
                return False
            
            # Recreate signature
            path = parsed.path
            signature_data = f"{path}:{expires}:{','.join(permissions)}"
            expected_signature = hmac.new(
                self.secret_key.encode(),
                signature_data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            if signature != expected_signature:
                return False
            
            # Check access count
            url_id = f"url_{hashlib.md5(url.encode()).hexdigest()}"
            current_count = await self._get_signed_url_access_count(url_id)
            max_accesses = await self._get_signed_url_max_accesses(url_id)
            
            if current_count >= max_accesses:
                return False
            
            # Increment access count
            await self._increment_signed_url_access_count(url_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating signed URL: {str(e)}")
            return False
    
    async def create_rls_rule(self, name: str, table: str, policy: str, 
                            roles: List[str], conditions: str, description: str) -> RLSRule:
        """
        Create a Row Level Security rule
        
        Args:
            name: Name of the rule
            table: Database table
            policy: Policy name
            roles: List of roles this rule applies to
            conditions: SQL conditions for the rule
            description: Description of the rule
            
        Returns:
            RLSRule object
        """
        rls_rule = RLSRule(
            id=f"rls_{hashlib.md5(f"{name}{table}".encode()).hexdigest()}",
            name=name,
            table=table,
            policy=policy,
            roles=roles,
            conditions=conditions,
            status='active',
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            created_by='system',
            description=description
        )
        
        # Save to database
        await self._save_rls_rule(rls_rule)
        
        # Apply RLS policy to database
        await self._apply_rls_policy(rls_rule)
        
        logger.info(f"Created RLS rule: {name} for table {table}")
        return rls_rule
    
    async def _save_security_scan(self, scan: SecurityScan):
        """Save security scan to database"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO security_scans (
                        id, type, status, started_at, completed_at,
                        vulnerabilities_found, critical_count, high_count,
                        medium_count, low_count, scan_config, results_summary
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        completed_at = EXCLUDED.completed_at,
                        vulnerabilities_found = EXCLUDED.vulnerabilities_found,
                        critical_count = EXCLUDED.critical_count,
                        high_count = EXCLUDED.high_count,
                        medium_count = EXCLUDED.medium_count,
                        low_count = EXCLUDED.low_count,
                        scan_config = EXCLUDED.scan_config,
                        results_summary = EXCLUDED.results_summary,
                        updated_at = NOW()
                """, (
                    scan.id, scan.type, scan.status, scan.started_at, scan.completed_at,
                    scan.vulnerabilities_found, scan.critical_count, scan.high_count,
                    scan.medium_count, scan.low_count, json.dumps(scan.scan_config), scan.results_summary
                ))
    
    async def _save_vulnerability(self, vuln: Vulnerability):
        """Save vulnerability to database"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO security_vulnerabilities (
                        id, package_name, package_version, vulnerability_id,
                        severity, title, description, cve_id, cvss_score,
                        affected_versions, fixed_versions, published_date,
                        last_updated, status, remediation, references
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        last_updated = EXCLUDED.last_updated
                """, (
                    vuln.id, vuln.package_name, vuln.package_version, vuln.vulnerability_id,
                    vuln.severity, vuln.title, vuln.description, vuln.cve_id, vuln.cvss_score,
                    json.dumps(vuln.affected_versions), json.dumps(vuln.fixed_versions),
                    vuln.published_date, vuln.last_updated, vuln.status, vuln.remediation,
                    json.dumps(vuln.references)
                ))
    
    async def _save_signed_url(self, signed_url: SignedURL):
        """Save signed URL to database"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO signed_urls (
                        id, url, resource_type, resource_id, expires_at,
                        created_at, created_by, access_count, max_accesses,
                        status, permissions
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        access_count = EXCLUDED.access_count,
                        status = EXCLUDED.status,
                        updated_at = NOW()
                """, (
                    signed_url.id, signed_url.url, signed_url.resource_type,
                    signed_url.resource_id, signed_url.expires_at, signed_url.created_at,
                    signed_url.created_by, signed_url.access_count, signed_url.max_accesses,
                    signed_url.status, json.dumps(signed_url.permissions)
                ))
    
    async def _save_rls_rule(self, rls_rule: RLSRule):
        """Save RLS rule to database"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO rls_rules (
                        id, name, table_name, policy, roles, conditions,
                        status, created_at, updated_at, created_by, description
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        status = EXCLUDED.status,
                        updated_at = EXCLUDED.updated_at
                """, (
                    rls_rule.id, rls_rule.name, rls_rule.table, rls_rule.policy,
                    json.dumps(rls_rule.roles), rls_rule.conditions, rls_rule.status,
                    rls_rule.created_at, rls_rule.updated_at, rls_rule.created_by,
                    rls_rule.description
                ))
    
    async def _get_signed_url_access_count(self, url_id: str) -> int:
        """Get current access count for signed URL"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT access_count FROM signed_urls WHERE id = %s", (url_id,))
                result = cur.fetchone()
                return result[0] if result else 0
    
    async def _get_signed_url_max_accesses(self, url_id: str) -> int:
        """Get max accesses for signed URL"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT max_accesses FROM signed_urls WHERE id = %s", (url_id,))
                result = cur.fetchone()
                return result[0] if result else 1
    
    async def _increment_signed_url_access_count(self, url_id: str):
        """Increment access count for signed URL"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE signed_urls 
                    SET access_count = access_count + 1, updated_at = NOW()
                    WHERE id = %s
                """, (url_id,))
    
    async def _apply_rls_policy(self, rls_rule: RLSRule):
        """Apply RLS policy to database table"""
        with self.get_db_connection() as conn:
            with conn.cursor() as cur:
                # Enable RLS on table if not already enabled
                cur.execute(f"ALTER TABLE {rls_rule.table} ENABLE ROW LEVEL SECURITY")
                
                # Create policy
                policy_sql = f"""
                    CREATE POLICY {rls_rule.policy} ON {rls_rule.table}
                    FOR ALL USING ({rls_rule.conditions})
                """
                cur.execute(policy_sql)

async def main():
    """Main function for testing"""
    worker = SecurityWorker()
    
    # Test dependency scanning
    print("Testing dependency scanning...")
    scan_result = await worker.scan_dependencies("/path/to/project")
    print(f"Scan result: {scan_result.results_summary}")
    
    # Test signed URL creation
    print("\nTesting signed URL creation...")
    signed_url = await worker.create_signed_url("image", "post_123", 24, 10, ["read"])
    print(f"Signed URL: {signed_url.url}")
    
    # Test URL validation
    print("\nTesting URL validation...")
    is_valid = await worker.validate_signed_url(signed_url.url)
    print(f"URL valid: {is_valid}")

if __name__ == "__main__":
    asyncio.run(main())
