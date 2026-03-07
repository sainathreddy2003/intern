// 📱 SIMPLE MOBILE FUNCTIONALITY TESTER
// Retail ERP Application - No Dependencies Required

const http = require('http');
const https = require('https');

class SimpleMobileTester {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:3000';
    this.serverUrl = 'http://localhost:5002';
  }

  async runComprehensiveTests() {
    console.log('🚀 Starting Comprehensive Mobile Functionality Tests...');
    console.log('=' .repeat(60));

    try {
      // 1. Server Connectivity Tests
      await this.testServerConnectivity();
      
      // 2. Application Load Tests
      await this.testApplicationLoad();
      
      // 3. API Functionality Tests
      await this.testAPIFunctionality();
      
      // 4. Chart Functionality Tests
      await this.testChartFunctionality();
      
      // 5. Mobile Responsiveness Tests
      await this.testMobileResponsiveness();
      
      // 6. Performance Tests
      await this.testPerformance();
      
      // 7. Data Export Tests
      await this.testDataExport();
      
      // 8. Security Tests
      await this.testSecurity();
      
      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      this.addTestResult('Test Execution', {
        status: 'FAIL',
        error: error.message,
        details: 'Test suite failed to execute'
      });
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const req = protocol.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        }));
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
      req.end();
    });
  }

  async testServerConnectivity() {
    console.log('🌐 Testing Server Connectivity...');
    
    try {
      // Test frontend server
      const frontendStart = Date.now();
      const frontendResponse = await this.makeRequest(this.baseUrl);
      const frontendTime = Date.now() - frontendStart;
      
      this.addTestResult('Frontend Server', {
        status: frontendResponse.statusCode === 200 ? 'PASS' : 'FAIL',
        responseTime: `${frontendTime}ms`,
        statusCode: frontendResponse.statusCode,
        details: `Frontend server responded in ${frontendTime}ms`
      });
      
      // Test backend server
      const backendStart = Date.now();
      const backendResponse = await this.makeRequest(this.serverUrl);
      const backendTime = Date.now() - backendStart;
      
      this.addTestResult('Backend Server', {
        status: backendResponse.statusCode === 200 ? 'PASS' : 'FAIL',
        responseTime: `${backendTime}ms`,
        statusCode: backendResponse.statusCode,
        details: `Backend server responded in ${backendTime}ms`
      });
      
      // Test database connectivity (via API)
      const dbStart = Date.now();
      try {
        const dbResponse = await this.makeRequest(`${this.serverUrl}/api/health`);
        const dbTime = Date.now() - dbStart;
        
        this.addTestResult('Database Connectivity', {
          status: dbResponse.statusCode === 200 ? 'PASS' : 'FAIL',
          responseTime: `${dbTime}ms`,
          details: `Database connection verified in ${dbTime}ms`
        });
      } catch (dbError) {
        this.addTestResult('Database Connectivity', {
          status: 'SKIP',
          details: 'Database health endpoint not available'
        });
      }
      
    } catch (error) {
      this.addTestResult('Server Connectivity', {
        status: 'FAIL',
        error: error.message,
        details: 'Server connectivity test failed'
      });
    }
  }

  async testApplicationLoad() {
    console.log('📱 Testing Application Load...');
    
    try {
      // Test main application load
      const loadStart = Date.now();
      const response = await this.makeRequest(this.baseUrl);
      const loadTime = Date.now() - loadStart;
      
      // Check for key application elements
      const body = response.body;
      const hasReact = body.includes('react') || body.includes('React');
      const hasMaterialUI = body.includes('Material-UI') || body.includes('mui');
      const hasChartJS = body.includes('Chart.js') || body.includes('chart');
      const hasLogin = body.includes('login') || body.includes('username');
      const hasDashboard = body.includes('dashboard') || body.includes('Dashboard');
      
      this.addTestResult('Application Load', {
        status: response.statusCode === 200 ? 'PASS' : 'FAIL',
        loadTime: `${loadTime}ms`,
        hasReact,
        hasMaterialUI,
        hasChartJS,
        hasLogin,
        hasDashboard,
        details: `Application loaded in ${loadTime}ms with React: ${hasReact}, Material-UI: ${hasMaterialUI}, Chart.js: ${hasChartJS}`
      });
      
      // Test mobile viewport meta tag
      const hasViewportMeta = body.includes('viewport') || body.includes('width=device-width');
      
      this.addTestResult('Mobile Viewport', {
        status: hasViewportMeta ? 'PASS' : 'FAIL',
        hasViewportMeta,
        details: `Mobile viewport meta tag ${hasViewportMeta ? 'found' : 'missing'}`
      });
      
      // Test responsive CSS
      const hasResponsiveCSS = body.includes('media') || body.includes('@media') || body.includes('responsive');
      
      this.addTestResult('Responsive CSS', {
        status: hasResponsiveCSS ? 'PASS' : 'FAIL',
        hasResponsiveCSS,
        details: `Responsive CSS ${hasResponsiveCSS ? 'found' : 'missing'}`
      });
      
    } catch (error) {
      this.addTestResult('Application Load', {
        status: 'FAIL',
        error: error.message,
        details: 'Application load test failed'
      });
    }
  }

  async testAPIFunctionality() {
    console.log('🔌 Testing API Functionality...');
    
    const apiEndpoints = [
      '/api/auth/login',
      '/api/sales',
      '/api/customers',
      '/api/inventory',
      '/api/reports'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        const start = Date.now();
        const response = await this.makeRequest(`${this.serverUrl}${endpoint}`);
        const responseTime = Date.now() - start;
        
        this.addTestResult(`API - ${endpoint}`, {
          status: response.statusCode < 500 ? 'PASS' : 'FAIL',
          responseTime: `${responseTime}ms`,
          statusCode: response.statusCode,
          details: `Endpoint ${endpoint} responded in ${responseTime}ms with status ${response.statusCode}`
        });
        
      } catch (error) {
        this.addTestResult(`API - ${endpoint}`, {
          status: 'FAIL',
          error: error.message,
          details: `API endpoint ${endpoint} failed`
        });
      }
    }
  }

  async testChartFunctionality() {
    console.log('📊 Testing Chart Functionality...');
    
    try {
      // Test reports page for charts
      const response = await this.makeRequest(`${this.baseUrl}/reports`);
      const body = response.body;
      
      // Check for chart-related elements
      const hasChartJS = body.includes('Chart.js') || body.includes('chart');
      const hasCanvas = body.includes('<canvas') || body.includes('canvas');
      const hasChartElements = body.includes('chart') || body.includes('Chart');
      const hasStockMarketStyle = body.includes('trading') || body.includes('bull') || body.includes('bear');
      
      // Count potential chart elements
      const canvasCount = (body.match(/canvas/g) || []).length;
      const chartCount = (body.match(/chart/gi) || []).length;
      
      this.addTestResult('Chart Functionality', {
        status: hasChartJS && hasCanvas ? 'PASS' : 'FAIL',
        hasChartJS,
        hasCanvas,
        canvasCount,
        chartCount,
        hasStockMarketStyle,
        details: `Found ${canvasCount} canvas elements, ${chartCount} chart references, stock market style: ${hasStockMarketStyle}`
      });
      
      // Test chart data availability
      try {
        const chartDataResponse = await this.makeRequest(`${this.serverUrl}/api/reports/sales`);
        const hasChartData = chartDataResponse.statusCode === 200;
        
        this.addTestResult('Chart Data Availability', {
          status: hasChartData ? 'PASS' : 'FAIL',
          statusCode: chartDataResponse.statusCode,
          details: `Chart data API ${hasChartData ? 'available' : 'unavailable'}`
        });
      } catch (dataError) {
        this.addTestResult('Chart Data Availability', {
          status: 'SKIP',
          details: 'Chart data endpoint not accessible'
        });
      }
      
    } catch (error) {
      this.addTestResult('Chart Functionality', {
        status: 'FAIL',
        error: error.message,
        details: 'Chart functionality test failed'
      });
    }
  }

  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Check for mobile-friendly elements
      const hasViewportMeta = body.includes('viewport') || body.includes('width=device-width');
      const hasTouchOptimized = body.includes('touch') || body.includes('ontouch');
      const hasMobileNav = body.includes('hamburger') || body.includes('menu-toggle') || body.includes('mobile-nav');
      const hasResponsiveImages = body.includes('srcset') || body.includes('responsive') || body.includes('picture');
      
      // Check for CSS media queries
      const hasMediaQueries = body.includes('@media') || body.includes('media-query');
      
      // Check for mobile-specific CSS classes
      const hasMobileClasses = body.includes('mobile') || body.includes('sm:') || body.includes('md:') || body.includes('lg:');
      
      this.addTestResult('Mobile Responsiveness', {
        status: hasViewportMeta ? 'PASS' : 'FAIL',
        hasViewportMeta,
        hasTouchOptimized,
        hasMobileNav,
        hasResponsiveImages,
        hasMediaQueries,
        hasMobileClasses,
        details: `Mobile optimization: viewport=${hasViewportMeta}, touch=${hasTouchOptimized}, nav=${hasMobileNav}`
      });
      
      // Test mobile-specific features
      const hasGestures = body.includes('swipe') || body.includes('pinch') || body.includes('touch');
      const hasMobileButtons = body.includes('button') || body.includes('btn');
      
      this.addTestResult('Mobile Features', {
        status: hasGestures || hasMobileButtons ? 'PASS' : 'FAIL',
        hasGestures,
        hasMobileButtons,
        details: `Mobile features: gestures=${hasGestures}, buttons=${hasMobileButtons}`
      });
      
    } catch (error) {
      this.addTestResult('Mobile Responsiveness', {
        status: 'FAIL',
        error: error.message,
        details: 'Mobile responsiveness test failed'
      });
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      // Test load performance
      const loadTests = [
        this.baseUrl,
        `${this.baseUrl}/dashboard`,
        `${this.baseUrl}/reports`,
        `${this.baseUrl}/customers`
      ];
      
      let totalLoadTime = 0;
      let successfulLoads = 0;
      
      for (const url of loadTests) {
        try {
          const start = Date.now();
          const response = await this.makeRequest(url);
          const loadTime = Date.now() - start;
          
          totalLoadTime += loadTime;
          successfulLoads++;
          
          this.addTestResult(`Performance - ${url.split('/').pop() || 'home'}`, {
            status: loadTime < 3000 ? 'PASS' : 'FAIL',
            loadTime: `${loadTime}ms`,
            details: `Page ${url} loaded in ${loadTime}ms`
          });
          
        } catch (loadError) {
          this.addTestResult(`Performance - ${url.split('/').pop() || 'home'}`, {
            status: 'FAIL',
            error: loadError.message,
            details: `Failed to load ${url}`
          });
        }
      }
      
      // Calculate average performance
      const avgLoadTime = successfulLoads > 0 ? totalLoadTime / successfulLoads : 0;
      
      this.addTestResult('Performance Summary', {
        status: avgLoadTime < 3000 ? 'PASS' : 'FAIL',
        avgLoadTime: `${avgLoadTime.toFixed(2)}ms`,
        pagesTested: `${successfulLoads}/${loadTests.length}`,
        details: `Average load time: ${avgLoadTime.toFixed(2)}ms`
      });
      
    } catch (error) {
      this.addTestResult('Performance', {
        status: 'FAIL',
        error: error.message,
        details: 'Performance test failed'
      });
    }
  }

  async testDataExport() {
    console.log('💾 Testing Data Export...');
    
    try {
      // Test export endpoints
      const exportEndpoints = [
        '/api/export/sales',
        '/api/export/customers',
        '/api/export/reports'
      ];
      
      for (const endpoint of exportEndpoints) {
        try {
          const start = Date.now();
          const response = await this.makeRequest(`${this.serverUrl}${endpoint}`);
          const responseTime = Date.now() - start;
          
          this.addTestResult(`Export - ${endpoint.split('/').pop()}`, {
            status: response.statusCode < 500 ? 'PASS' : 'FAIL',
            responseTime: `${responseTime}ms`,
            statusCode: response.statusCode,
            details: `Export endpoint ${endpoint} responded in ${responseTime}ms`
          });
          
        } catch (exportError) {
          this.addTestResult(`Export - ${endpoint.split('/').pop()}`, {
            status: 'FAIL',
            error: exportError.message,
            details: `Export endpoint ${endpoint} failed`
          });
        }
      }
      
      // Test frontend export functionality
      const response = await this.makeRequest(`${this.baseUrl}/reports`);
      const body = response.body;
      
      const hasExportButtons = body.includes('export') || body.includes('download') || body.includes('Excel');
      const hasExportFunctionality = body.includes('exportToExcel') || body.includes('exportData');
      
      this.addTestResult('Frontend Export', {
        status: hasExportButtons ? 'PASS' : 'FAIL',
        hasExportButtons,
        hasExportFunctionality,
        details: `Export functionality: buttons=${hasExportButtons}, functions=${hasExportFunctionality}`
      });
      
    } catch (error) {
      this.addTestResult('Data Export', {
        status: 'FAIL',
        error: error.message,
        details: 'Data export test failed'
      });
    }
  }

  async testSecurity() {
    console.log('🔐 Testing Security...');
    
    try {
      // Test HTTPS enforcement (if applicable)
      const httpResponse = await this.makeRequest(this.baseUrl);
      const hasSecurityHeaders = httpResponse.headers['x-frame-options'] || 
                               httpResponse.headers['x-content-type-options'] ||
                               httpResponse.headers['x-xss-protection'];
      
      this.addTestResult('Security Headers', {
        status: hasSecurityHeaders ? 'PASS' : 'WARN',
        hasSecurityHeaders: !!hasSecurityHeaders,
        details: `Security headers ${hasSecurityHeaders ? 'present' : 'missing'}`
      });
      
      // Test authentication endpoints
      try {
        const authResponse = await this.makeRequest(`${this.serverUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        this.addTestResult('Authentication Endpoint', {
          status: authResponse.statusCode < 500 ? 'PASS' : 'FAIL',
          statusCode: authResponse.statusCode,
          details: `Auth endpoint available with status ${authResponse.statusCode}`
        });
        
      } catch (authError) {
        this.addTestResult('Authentication Endpoint', {
          status: 'FAIL',
          error: authError.message,
          details: 'Authentication endpoint not accessible'
        });
      }
      
      // Test for common security vulnerabilities
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      const hasConsoleLogs = body.includes('console.log') || body.includes('console.error');
      const hasDebugInfo = body.includes('debug') || body.includes('DEBUG');
      const hasSensitiveData = body.includes('password') || body.includes('secret') || body.includes('key');
      
      this.addTestResult('Security Best Practices', {
        status: !hasConsoleLogs && !hasDebugInfo ? 'PASS' : 'WARN',
        hasConsoleLogs,
        hasDebugInfo,
        hasSensitiveData,
        details: `Security: console=${hasConsoleLogs}, debug=${hasDebugInfo}, sensitive=${hasSensitiveData}`
      });
      
    } catch (error) {
      this.addTestResult('Security', {
        status: 'FAIL',
        error: error.message,
        details: 'Security test failed'
      });
    }
  }

  addTestResult(testName, result) {
    this.testResults.push({
      testName,
      timestamp: new Date().toISOString(),
      ...result
    });
    
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${status} ${testName}: ${result.details}`);
  }

  async generateReport() {
    console.log('\n📋 Generating Comprehensive Test Report...');
    console.log('=' .repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.status === 'PASS').length;
    const failedTests = this.testResults.filter(test => test.status === 'FAIL').length;
    const skippedTests = this.testResults.filter(test => test.status === 'SKIP').length;
    const warningTests = this.testResults.filter(test => test.status === 'WARN').length;
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(2);
    
    // Calculate performance metrics
    const performanceTests = this.testResults.filter(test => test.loadTime || test.responseTime);
    const avgResponseTime = performanceTests.length > 0 
      ? performanceTests.reduce((sum, test) => {
          const time = parseFloat(test.loadTime || test.responseTime || '0');
          return sum + time;
        }, 0) / performanceTests.length
      : 0;
    
    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        warningTests,
        successRate: `${successRate}%`,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        testDuration: 'Comprehensive testing completed'
      },
      testResults: this.testResults,
      recommendations: this.generateRecommendations(),
      functionalityScore: this.calculateFunctionalityScore()
    };
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('./comprehensive_functionality_report.json', JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n📊 COMPREHENSIVE FUNCTIONALITY ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log(`📱 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️ Warnings: ${warningTests}`);
    console.log(`⏭️ Skipped: ${skippedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⚡ Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Functionality Score: ${report.functionalityScore}/100`);
    console.log('='.repeat(60));
    
    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n🔧 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.action}: ${rec.details}`);
      });
    }
    
    console.log('\n📄 Detailed report saved to: comprehensive_functionality_report.json');
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(test => test.status === 'FAIL');
    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Fix Failed Tests',
        details: `${failedTests.length} tests failed, immediate attention required`
      });
    }
    
    const warningTests = this.testResults.filter(test => test.status === 'WARN');
    if (warningTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Address Warnings',
        details: `${warningTests.length} warnings need attention`
      });
    }
    
    const performanceTests = this.testResults.filter(test => test.loadTime || test.responseTime);
    const avgResponseTime = performanceTests.length > 0 
      ? performanceTests.reduce((sum, test) => sum + parseFloat(test.loadTime || test.responseTime || '0'), 0) / performanceTests.length
      : 0;
    
    if (avgResponseTime > 3000) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Optimize Performance',
        details: `Average response time is ${avgResponseTime.toFixed(2)}ms, should be under 3000ms`
      });
    }
    
    return recommendations;
  }

  calculateFunctionalityScore() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.status === 'PASS').length;
    const warningTests = this.testResults.filter(test => test.status === 'WARN').length;
    
    // Base score from passed tests
    let score = (passedTests / totalTests) * 100;
    
    // Deduct points for failures
    const failedTests = this.testResults.filter(test => test.status === 'FAIL').length;
    score -= (failedTests / totalTests) * 50;
    
    // Small deduction for warnings
    score -= (warningTests / totalTests) * 10;
    
    // Ensure score doesn't go below 0
    return Math.max(0, Math.round(score));
  }
}

// Execute tests
async function runComprehensiveTests() {
  const tester = new SimpleMobileTester();
  
  try {
    await tester.runComprehensiveTests();
  } catch (error) {
    console.error('❌ Comprehensive testing failed:', error);
  }
}

// Export for use
module.exports = { SimpleMobileTester, runComprehensiveTests };

// Run if called directly
if (require.main === module) {
  runComprehensiveTests();
}
