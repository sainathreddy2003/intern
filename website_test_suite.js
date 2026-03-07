// 🌐 COMPREHENSIVE WEBSITE TESTING SUITE
// Retail ERP Application - Full Website Testing Framework

const http = require('http');
const https = require('https');
const { URL } = require('url');

class WebsiteTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.performanceMetrics = {
      loadTimes: [],
      responseTimes: [],
      errorCounts: 0
    };
  }

  async runComprehensiveWebsiteTests() {
    console.log('🌐 Starting Comprehensive Website Testing Suite...');
    console.log('=' .repeat(70));

    try {
      // 1. Basic Connectivity Tests
      await this.testBasicConnectivity();
      
      // 2. Page Load Tests
      await this.testPageLoadPerformance();
      
      // 3. Navigation Tests
      await this.testNavigation();
      
      // 4. Content Tests
      await this.testContent();
      
      // 5. Functionality Tests
      await this.testFunctionality();
      
      // 6. UI/UX Tests
      await this.testUIUX();
      
      // 7. Performance Tests
      await this.testPerformance();
      
      // 8. Security Tests
      await this.testSecurity();
      
      // 9. SEO Tests
      await this.testSEO();
      
      // 10. Accessibility Tests
      await this.testAccessibility();
      
      // 11. Mobile Responsiveness Tests
      await this.testMobileResponsiveness();
      
      // 12. Error Handling Tests
      await this.testErrorHandling();
      
      // Generate comprehensive report
      await this.generateWebsiteTestReport();
      
    } catch (error) {
      console.error('❌ Website testing failed:', error.message);
      this.addTestResult('Test Execution', {
        status: 'FAIL',
        error: error.message,
        details: 'Website test suite failed to execute'
      });
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const req = protocol.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        }));
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
      req.end();
    });
  }

  async testBasicConnectivity() {
    console.log('🔗 Testing Basic Connectivity...');
    
    try {
      // Test main page
      const start = Date.now();
      const response = await this.makeRequest(this.baseUrl);
      const responseTime = Date.now() - start;
      
      this.performanceMetrics.responseTimes.push(responseTime);
      
      this.addTestResult('Main Page Connectivity', {
        status: response.statusCode === 200 ? 'PASS' : 'FAIL',
        responseTime: `${responseTime}ms`,
        statusCode: response.statusCode,
        contentLength: response.body.length,
        details: `Main page loaded in ${responseTime}ms with ${response.body.length} bytes`
      });
      
      // Test different protocols
      const httpsUrl = this.baseUrl.replace('http://', 'https://');
      try {
        const httpsResponse = await this.makeRequest(httpsUrl);
        this.addTestResult('HTTPS Support', {
          status: 'PASS',
          statusCode: httpsResponse.statusCode,
          details: `HTTPS supported with status ${httpsResponse.statusCode}`
        });
      } catch (httpsError) {
        this.addTestResult('HTTPS Support', {
          status: 'SKIP',
          details: 'HTTPS not available or configured'
        });
      }
      
      // Test port connectivity
      const ports = [3000, 5002, 8080];
      for (const port of ports) {
        try {
          const portUrl = this.baseUrl.replace(/:\d+/, `:${port}`);
          const portResponse = await this.makeRequest(portUrl);
          this.addTestResult(`Port ${port}`, {
            status: portResponse.statusCode < 500 ? 'PASS' : 'FAIL',
            statusCode: portResponse.statusCode,
            details: `Port ${port} responding with status ${portResponse.statusCode}`
          });
        } catch (portError) {
          this.addTestResult(`Port ${port}`, {
            status: 'FAIL',
            details: `Port ${port} not accessible`
          });
        }
      }
      
    } catch (error) {
      this.addTestResult('Basic Connectivity', {
        status: 'FAIL',
        error: error.message,
        details: 'Basic connectivity test failed'
      });
    }
  }

  async testPageLoadPerformance() {
    console.log('⚡ Testing Page Load Performance...');
    
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/reports', name: 'Reports' },
      { path: '/customers', name: 'Customers' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/login', name: 'Login' }
    ];
    
    for (const page of pages) {
      try {
        const url = `${this.baseUrl}${page.path}`;
        const start = Date.now();
        const response = await this.makeRequest(url);
        const loadTime = Date.now() - start;
        
        this.performanceMetrics.loadTimes.push(loadTime);
        
        // Check for performance indicators
        const body = response.body;
        const hasMinifiedCSS = !body.includes('  ') && !body.includes('\n\n');
        const hasOptimizedImages = body.includes('webp') || body.includes('optimized');
        const hasLazyLoading = body.includes('loading="lazy"') || body.includes('lazyload');
        
        this.addTestResult(`Page Load - ${page.name}`, {
          status: loadTime < 3000 ? 'PASS' : 'FAIL',
          loadTime: `${loadTime}ms`,
          contentLength: response.body.length,
          hasMinifiedCSS,
          hasOptimizedImages,
          hasLazyLoading,
          details: `${page.name} page loaded in ${loadTime}ms with ${response.body.length} bytes`
        });
        
      } catch (error) {
        this.addTestResult(`Page Load - ${page.name}`, {
          status: 'FAIL',
          error: error.message,
          details: `Failed to load ${page.name} page`
        });
      }
    }
    
    // Calculate average performance
    const avgLoadTime = this.performanceMetrics.loadTimes.length > 0 
      ? this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.loadTimes.length
      : 0;
    
    this.addTestResult('Performance Summary', {
      status: avgLoadTime < 3000 ? 'PASS' : 'FAIL',
      avgLoadTime: `${avgLoadTime.toFixed(2)}ms`,
      pagesTested: this.performanceMetrics.loadTimes.length,
      details: `Average page load time: ${avgLoadTime.toFixed(2)}ms`
    });
  }

  async testNavigation() {
    console.log('🧭 Testing Navigation...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Check for navigation elements
      const hasNav = body.includes('<nav') || body.includes('navbar') || body.includes('navigation');
      const hasMenu = body.includes('menu') || body.includes('Menu');
      const hasLinks = body.includes('<a href') || body.includes('href=');
      const hasDropdown = body.includes('dropdown') || body.includes('Dropdown');
      
      this.addTestResult('Navigation Structure', {
        status: hasNav && hasLinks ? 'PASS' : 'FAIL',
        hasNav,
        hasMenu,
        hasLinks,
        hasDropdown,
        details: `Navigation: nav=${hasNav}, menu=${hasMenu}, links=${hasLinks}, dropdown=${hasDropdown}`
      });
      
      // Test navigation links
      const linkRegex = /href=["']([^"']+)["']/g;
      const links = [];
      let match;
      while ((match = linkRegex.exec(body)) !== null) {
        links.push(match[1]);
      }
      
      // Test internal links
      const internalLinks = links.filter(link => 
        link.startsWith('/') || link.includes('localhost')
      ).slice(0, 5); // Test first 5 internal links
      
      let workingLinks = 0;
      for (const link of internalLinks) {
        try {
          const fullUrl = link.startsWith('http') ? link : `${this.baseUrl}${link}`;
          const linkResponse = await this.makeRequest(fullUrl);
          if (linkResponse.statusCode < 500) {
            workingLinks++;
          }
        } catch (linkError) {
          // Link not working
        }
      }
      
      this.addTestResult('Navigation Links', {
        status: workingLinks > 0 ? 'PASS' : 'FAIL',
        totalLinks: links.length,
        internalLinks: internalLinks.length,
        workingLinks: `${workingLinks}/${internalLinks.length}`,
        details: `${workingLinks} out of ${internalLinks.length} internal links working`
      });
      
      // Test breadcrumb navigation
      const hasBreadcrumbs = body.includes('breadcrumb') || body.includes('Breadcrumb');
      
      this.addTestResult('Breadcrumb Navigation', {
        status: hasBreadcrumbs ? 'PASS' : 'SKIP',
        hasBreadcrumbs,
        details: `Breadcrumb navigation ${hasBreadcrumbs ? 'available' : 'not implemented'}`
      });
      
    } catch (error) {
      this.addTestResult('Navigation', {
        status: 'FAIL',
        error: error.message,
        details: 'Navigation test failed'
      });
    }
  }

  async testContent() {
    console.log('📝 Testing Content...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Check for essential content
      const hasTitle = body.includes('<title>') && body.includes('</title>');
      const hasMetaDescription = body.includes('name="description"') || body.includes('name=\'description\'');
      const hasHeadings = body.includes('<h1') || body.includes('<h2') || body.includes('<h3');
      const hasContent = body.length > 1000; // Minimum content length
      
      this.addTestResult('Content Structure', {
        status: hasTitle && hasHeadings && hasContent ? 'PASS' : 'FAIL',
        hasTitle,
        hasMetaDescription,
        hasHeadings,
        hasContent,
        contentLength: body.length,
        details: `Content: title=${hasTitle}, meta=${hasMetaDescription}, headings=${hasHeadings}, length=${body.length}`
      });
      
      // Test for duplicate content
      const words = body.toLowerCase().split(/\s+/);
      const wordCount = words.length;
      const uniqueWords = new Set(words).size;
      const duplicateRatio = ((wordCount - uniqueWords) / wordCount * 100).toFixed(2);
      
      this.addTestResult('Content Quality', {
        status: duplicateRatio < 70 ? 'PASS' : 'WARN',
        wordCount,
        uniqueWords,
        duplicateRatio: `${duplicateRatio}%`,
        details: `Word count: ${wordCount}, Unique: ${uniqueWords}, Duplicate ratio: ${duplicateRatio}%`
      });
      
      // Test for images and media
      const hasImages = body.includes('<img') || body.includes('image');
      const hasVideos = body.includes('<video') || body.includes('video');
      const hasAltText = body.includes('alt=') || body.includes('alt=');
      
      this.addTestResult('Media Content', {
        status: hasImages ? 'PASS' : 'SKIP',
        hasImages,
        hasVideos,
        hasAltText,
        details: `Media: images=${hasImages}, videos=${hasVideos}, alt text=${hasAltText}`
      });
      
    } catch (error) {
      this.addTestResult('Content', {
        status: 'FAIL',
        error: error.message,
        details: 'Content test failed'
      });
    }
  }

  async testFunctionality() {
    console.log('⚙️ Testing Functionality...');
    
    try {
      // Test forms
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      const hasForms = body.includes('<form') || body.includes('form');
      const hasInputs = body.includes('<input') || body.includes('input');
      const hasButtons = body.includes('<button') || body.includes('button') || body.includes('btn');
      const hasValidation = body.includes('required') || body.includes('validation');
      
      this.addTestResult('Form Functionality', {
        status: hasForms && hasInputs ? 'PASS' : 'SKIP',
        hasForms,
        hasInputs,
        hasButtons,
        hasValidation,
        details: `Forms: form=${hasForms}, inputs=${hasInputs}, buttons=${hasButtons}, validation=${hasValidation}`
      });
      
      // Test login functionality
      try {
        const loginResponse = await this.makeRequest(`${this.baseUrl}/login`);
        const hasLoginForm = loginResponse.body.includes('username') || loginResponse.body.includes('password');
        
        this.addTestResult('Login Functionality', {
          status: hasLoginForm ? 'PASS' : 'SKIP',
          hasLoginForm,
          details: `Login form ${hasLoginForm ? 'available' : 'not found'}`
        });
      } catch (loginError) {
        this.addTestResult('Login Functionality', {
          status: 'SKIP',
          details: 'Login page not accessible'
        });
      }
      
      // Test dashboard functionality
      try {
        const dashboardResponse = await this.makeRequest(`${this.baseUrl}/dashboard`);
        const hasDashboard = dashboardResponse.body.includes('dashboard') || dashboardResponse.body.includes('Dashboard');
        const hasCharts = dashboardResponse.body.includes('chart') || dashboardResponse.body.includes('Chart');
        const hasMetrics = dashboardResponse.body.includes('metric') || dashboardResponse.body.includes('sales');
        
        this.addTestResult('Dashboard Functionality', {
          status: hasDashboard ? 'PASS' : 'FAIL',
          hasDashboard,
          hasCharts,
          hasMetrics,
          details: `Dashboard: available=${hasDashboard}, charts=${hasCharts}, metrics=${hasMetrics}`
        });
      } catch (dashboardError) {
        this.addTestResult('Dashboard Functionality', {
          status: 'FAIL',
          details: 'Dashboard not accessible'
        });
      }
      
      // Test search functionality
      const hasSearch = body.includes('search') || body.includes('Search') || body.includes('query');
      
      this.addTestResult('Search Functionality', {
        status: hasSearch ? 'PASS' : 'SKIP',
        hasSearch,
        details: `Search functionality ${hasSearch ? 'available' : 'not implemented'}`
      });
      
    } catch (error) {
      this.addTestResult('Functionality', {
        status: 'FAIL',
        error: error.message,
        details: 'Functionality test failed'
      });
    }
  }

  async testUIUX() {
    console.log('🎨 Testing UI/UX...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Test CSS framework
      const hasBootstrap = body.includes('bootstrap') || body.includes('Bootstrap');
      const hasMaterialUI = body.includes('material-ui') || body.includes('mui') || body.includes('Material-UI');
      const hasTailwind = body.includes('tailwind') || body.includes('Tailwind');
      const hasCustomCSS = body.includes('<style') || body.includes('.css');
      
      this.addTestResult('CSS Framework', {
        status: hasBootstrap || hasMaterialUI || hasTailwind || hasCustomCSS ? 'PASS' : 'FAIL',
        hasBootstrap,
        hasMaterialUI,
        hasTailwind,
        hasCustomCSS,
        details: `CSS: Bootstrap=${hasBootstrap}, Material-UI=${hasMaterialUI}, Tailwind=${hasTailwind}, Custom=${hasCustomCSS}`
      });
      
      // Test JavaScript framework
      const hasReact = body.includes('react') || body.includes('React');
      const hasVue = body.includes('vue') || body.includes('Vue');
      const hasAngular = body.includes('angular') || body.includes('Angular');
      const hasjQuery = body.includes('jquery') || body.includes('jQuery');
      
      this.addTestResult('JavaScript Framework', {
        status: hasReact || hasVue || hasAngular || hasjQuery ? 'PASS' : 'FAIL',
        hasReact,
        hasVue,
        hasAngular,
        hasjQuery,
        details: `JS: React=${hasReact}, Vue=${hasVue}, Angular=${hasAngular}, jQuery=${hasjQuery}`
      });
      
      // Test responsive design
      const hasViewportMeta = body.includes('viewport') || body.includes('width=device-width');
      const hasMediaQueries = body.includes('@media') || body.includes('media-query');
      const hasResponsiveClasses = body.includes('responsive') || body.includes('col-') || body.includes('md:');
      
      this.addTestResult('Responsive Design', {
        status: hasViewportMeta ? 'PASS' : 'FAIL',
        hasViewportMeta,
        hasMediaQueries,
        hasResponsiveClasses,
        details: `Responsive: viewport=${hasViewportMeta}, media=${hasMediaQueries}, classes=${hasResponsiveClasses}`
      });
      
      // Test color scheme and branding
      const hasFavicon = body.includes('favicon') || body.includes('icon');
      const hasLogo = body.includes('logo') || body.includes('Logo');
      const hasTheme = body.includes('theme') || body.includes('color');
      
      this.addTestResult('Branding & Theme', {
        status: hasFavicon || hasLogo ? 'PASS' : 'WARN',
        hasFavicon,
        hasLogo,
        hasTheme,
        details: `Branding: favicon=${hasFavicon}, logo=${hasLogo}, theme=${hasTheme}`
      });
      
    } catch (error) {
      this.addTestResult('UI/UX', {
        status: 'FAIL',
        error: error.message,
        details: 'UI/UX test failed'
      });
    }
  }

  async testPerformance() {
    console.log('🚀 Testing Performance...');
    
    try {
      // Test caching headers
      const response = await this.makeRequest(this.baseUrl);
      const hasCacheControl = response.headers['cache-control'];
      const hasETag = response.headers['etag'];
      const hasExpires = response.headers['expires'];
      
      this.addTestResult('Caching Headers', {
        status: hasCacheControl || hasETag ? 'PASS' : 'WARN',
        hasCacheControl: !!hasCacheControl,
        hasETag: !!hasETag,
        hasExpires: !!hasExpires,
        details: `Caching: cache-control=${!!hasCacheControl}, etag=${!!hasETag}, expires=${!!hasExpires}`
      });
      
      // Test compression
      const hasGzip = response.headers['content-encoding'] === 'gzip';
      const hasDeflate = response.headers['content-encoding'] === 'deflate';
      const hasBrotli = response.headers['content-encoding'] === 'br';
      
      this.addTestResult('Content Compression', {
        status: hasGzip || hasDeflate || hasBrotli ? 'PASS' : 'WARN',
        hasGzip,
        hasDeflate,
        hasBrotli,
        details: `Compression: gzip=${hasGzip}, deflate=${hasDeflate}, brotli=${hasBrotli}`
      });
      
      // Test resource loading
      const body = response.body;
      const hasMinifiedJS = !body.includes('  ') && !body.includes('\n\n');
      const hasOptimizedCSS = body.includes('.min.css') || !body.includes('  ');
      const hasLazyLoading = body.includes('loading="lazy"') || body.includes('lazyload');
      
      this.addTestResult('Resource Optimization', {
        status: hasMinifiedJS || hasOptimizedCSS ? 'PASS' : 'WARN',
        hasMinifiedJS,
        hasOptimizedCSS,
        hasLazyLoading,
        details: `Optimization: minified JS=${hasMinifiedJS}, optimized CSS=${hasOptimizedCSS}, lazy loading=${hasLazyLoading}`
      });
      
      // Test page size
      const pageSizeKB = (response.body.length / 1024).toFixed(2);
      const isOptimizedSize = response.body.length < 1024 * 1024; // Less than 1MB
      
      this.addTestResult('Page Size', {
        status: isOptimizedSize ? 'PASS' : 'WARN',
        pageSize: `${pageSizeKB}KB`,
        isOptimizedSize,
        details: `Page size: ${pageSizeKB}KB (under 1MB: ${isOptimizedSize})`
      });
      
    } catch (error) {
      this.addTestResult('Performance', {
        status: 'FAIL',
        error: error.message,
        details: 'Performance test failed'
      });
    }
  }

  async testSecurity() {
    console.log('🔐 Testing Security...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      
      // Test security headers
      const hasXFrameOptions = response.headers['x-frame-options'];
      const hasXContentTypeOptions = response.headers['x-content-type-options'];
      const hasXSSProtection = response.headers['x-xss-protection'];
      const hasStrictTransportSecurity = response.headers['strict-transport-security'];
      const hasContentSecurityPolicy = response.headers['content-security-policy'];
      
      this.addTestResult('Security Headers', {
        status: hasXFrameOptions || hasXContentTypeOptions ? 'PASS' : 'WARN',
        hasXFrameOptions: !!hasXFrameOptions,
        hasXContentTypeOptions: !!hasXContentTypeOptions,
        hasXSSProtection: !!hasXSSProtection,
        hasStrictTransportSecurity: !!hasStrictTransportSecurity,
        hasContentSecurityPolicy: !!hasContentSecurityPolicy,
        details: `Security headers: XFO=${!!hasXFrameOptions}, XCTO=${!!hasXContentTypeOptions}, XSS=${!!hasXSSProtection}`
      });
      
      // Test for security vulnerabilities
      const body = response.body;
      const hasConsoleLogs = body.includes('console.log') || body.includes('console.error');
      const hasDebugInfo = body.includes('debug') || body.includes('DEBUG');
      const hasSensitiveData = body.includes('password') || body.includes('secret') || body.includes('key');
      const hasErrorDetails = body.includes('stack trace') || body.includes('error details');
      
      this.addTestResult('Security Best Practices', {
        status: !hasConsoleLogs && !hasDebugInfo ? 'PASS' : 'WARN',
        hasConsoleLogs,
        hasDebugInfo,
        hasSensitiveData,
        hasErrorDetails,
        details: `Security: console=${hasConsoleLogs}, debug=${hasDebugInfo}, sensitive=${hasSensitiveData}`
      });
      
      // Test HTTPS enforcement
      const httpsUrl = this.baseUrl.replace('http://', 'https://');
      try {
        const httpsResponse = await this.makeRequest(httpsUrl);
        const hasHTTPSRedirect = httpsResponse.statusCode === 200 || httpsResponse.statusCode === 301;
        
        this.addTestResult('HTTPS Enforcement', {
          status: hasHTTPSRedirect ? 'PASS' : 'WARN',
          hasHTTPSRedirect,
          details: `HTTPS redirect: ${hasHTTPSRedirect ? 'working' : 'not configured'}`
        });
      } catch (httpsError) {
        this.addTestResult('HTTPS Enforcement', {
          status: 'WARN',
          details: 'HTTPS not available'
        });
      }
      
    } catch (error) {
      this.addTestResult('Security', {
        status: 'FAIL',
        error: error.message,
        details: 'Security test failed'
      });
    }
  }

  async testSEO() {
    console.log('🔍 Testing SEO...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Test SEO basics
      const hasTitle = body.includes('<title>') && body.includes('</title>');
      const hasMetaDescription = body.includes('name="description"') || body.includes('name=\'description\'');
      const hasMetaKeywords = body.includes('name="keywords"') || body.includes('name=\'keywords\'');
      const hasH1 = body.includes('<h1') || body.includes('</h1>');
      const hasStructuredData = body.includes('application/ld+json') || body.includes('structured-data');
      
      this.addTestResult('SEO Basics', {
        status: hasTitle && hasH1 ? 'PASS' : 'WARN',
        hasTitle,
        hasMetaDescription,
        hasMetaKeywords,
        hasH1,
        hasStructuredData,
        details: `SEO: title=${hasTitle}, meta desc=${hasMetaDescription}, keywords=${hasMetaKeywords}, H1=${hasH1}`
      });
      
      // Test title length
      const titleMatch = body.match(/<title>(.*?)<\/title>/);
      const titleLength = titleMatch ? titleMatch[1].length : 0;
      const isOptimalTitleLength = titleLength >= 30 && titleLength <= 60;
      
      this.addTestResult('Title Optimization', {
        status: isOptimalTitleLength ? 'PASS' : 'WARN',
        titleLength,
        isOptimalTitleLength,
        details: `Title length: ${titleLength} characters (optimal: 30-60)`
      });
      
      // Test meta description length
      const descMatch = body.match(/name=["']description["'] content=["'](.*?)["']/);
      const descLength = descMatch ? descMatch[1].length : 0;
      const isOptimalDescLength = descLength >= 120 && descLength <= 160;
      
      this.addTestResult('Meta Description', {
        status: isOptimalDescLength ? 'PASS' : 'WARN',
        descLength,
        isOptimalDescLength,
        details: `Meta description length: ${descLength} characters (optimal: 120-160)`
      });
      
      // Test heading structure
      const h1Count = (body.match(/<h1/g) || []).length;
      const h2Count = (body.match(/<h2/g) || []).length;
      const hasProperHeadingStructure = h1Count === 1 && h2Count > 0;
      
      this.addTestResult('Heading Structure', {
        status: hasProperHeadingStructure ? 'PASS' : 'WARN',
        h1Count,
        h2Count,
        hasProperHeadingStructure,
        details: `Headings: H1=${h1Count}, H2=${h2Count} (optimal: 1 H1, multiple H2)`
      });
      
    } catch (error) {
      this.addTestResult('SEO', {
        status: 'FAIL',
        error: error.message,
        details: 'SEO test failed'
      });
    }
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Test accessibility basics
      const hasLangAttribute = body.includes('lang=') || body.includes('html lang');
      const hasAltText = body.includes('alt=') || body.includes('alt=');
      const hasAriaLabels = body.includes('aria-') || body.includes('role=');
      const hasSemanticHTML = body.includes('<nav') || body.includes('<main') || body.includes('<header') || body.includes('<footer');
      
      this.addTestResult('Accessibility Basics', {
        status: hasLangAttribute && hasSemanticHTML ? 'PASS' : 'WARN',
        hasLangAttribute,
        hasAltText,
        hasAriaLabels,
        hasSemanticHTML,
        details: `Accessibility: lang=${hasLangAttribute}, alt=${hasAltText}, aria=${hasAriaLabels}, semantic=${hasSemanticHTML}`
      });
      
      // Test color contrast (basic check)
      const hasInlineStyles = body.includes('style=');
      const hasCSSColors = body.includes('color:') || body.includes('background-color:');
      
      this.addTestResult('Color Contrast', {
        status: 'SKIP',
        hasInlineStyles,
        hasCSSColors,
        details: 'Color contrast testing requires visual analysis - automated check skipped'
      });
      
      // Test keyboard navigation
      const hasTabIndex = body.includes('tabindex') || body.includes('tabindex=');
      const hasFocusStyles = body.includes(':focus') || body.includes('focus');
      
      this.addTestResult('Keyboard Navigation', {
        status: hasTabIndex || hasFocusStyles ? 'PASS' : 'WARN',
        hasTabIndex,
        hasFocusStyles,
        details: `Keyboard navigation: tabindex=${hasTabIndex}, focus=${hasFocusStyles}`
      });
      
      // Test form accessibility
      const hasFormLabels = body.includes('<label') || body.includes('for=');
      const hasRequiredFields = body.includes('required') || body.includes('aria-required');
      
      this.addTestResult('Form Accessibility', {
        status: hasFormLabels ? 'PASS' : 'WARN',
        hasFormLabels,
        hasRequiredFields,
        details: `Form accessibility: labels=${hasFormLabels}, required=${hasRequiredFields}`
      });
      
    } catch (error) {
      this.addTestResult('Accessibility', {
        status: 'FAIL',
        error: error.message,
        details: 'Accessibility test failed'
      });
    }
  }

  async testMobileResponsiveness() {
    console.log('📱 Testing Mobile Responsiveness...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      
      // Test mobile viewport
      const hasViewportMeta = body.includes('viewport') || body.includes('width=device-width');
      const hasMobileOptimized = body.includes('mobile') || body.includes('responsive');
      const hasTouchOptimized = body.includes('touch') || body.includes('ontouch');
      
      this.addTestResult('Mobile Viewport', {
        status: hasViewportMeta ? 'PASS' : 'FAIL',
        hasViewportMeta,
        hasMobileOptimized,
        hasTouchOptimized,
        details: `Mobile: viewport=${hasViewportMeta}, optimized=${hasMobileOptimized}, touch=${hasTouchOptimized}`
      });
      
      // Test responsive images
      const hasResponsiveImages = body.includes('srcset') || body.includes('sizes') || body.includes('picture');
      const hasOptimizedImages = body.includes('webp') || body.includes('optimized');
      
      this.addTestResult('Mobile Images', {
        status: hasResponsiveImages ? 'PASS' : 'WARN',
        hasResponsiveImages,
        hasOptimizedImages,
        details: `Mobile images: responsive=${hasResponsiveImages}, optimized=${hasOptimizedImages}`
      });
      
      // Test mobile navigation
      const hasMobileNav = body.includes('hamburger') || body.includes('menu-toggle') || body.includes('mobile-nav');
      const hasSwipeGestures = body.includes('swipe') || body.includes('touchstart');
      
      this.addTestResult('Mobile Navigation', {
        status: hasMobileNav ? 'PASS' : 'WARN',
        hasMobileNav,
        hasSwipeGestures,
        details: `Mobile navigation: hamburger=${hasMobileNav}, gestures=${hasSwipeGestures}`
      });
      
      // Test mobile performance
      const hasMinifiedMobileCSS = !body.includes('  ') || body.includes('.min.css');
      const hasLazyLoading = body.includes('loading="lazy"') || body.includes('lazyload');
      
      this.addTestResult('Mobile Performance', {
        status: hasMinifiedMobileCSS || hasLazyLoading ? 'PASS' : 'WARN',
        hasMinifiedMobileCSS,
        hasLazyLoading,
        details: `Mobile performance: minified=${hasMinifiedMobileCSS}, lazy=${hasLazyLoading}`
      });
      
    } catch (error) {
      this.addTestResult('Mobile Responsiveness', {
        status: 'FAIL',
        error: error.message,
        details: 'Mobile responsiveness test failed'
      });
    }
  }

  async testErrorHandling() {
    console.log('🚨 Testing Error Handling...');
    
    try {
      // Test 404 error page
      try {
        const notFoundResponse = await this.makeRequest(`${this.baseUrl}/nonexistent-page`);
        const hasCustom404 = notFoundResponse.body.includes('404') || notFoundResponse.body.includes('not found');
        
        this.addTestResult('404 Error Page', {
          status: hasCustom404 ? 'PASS' : 'WARN',
          hasCustom404,
          statusCode: notFoundResponse.statusCode,
          details: `404 page: custom=${hasCustom404}, status=${notFoundResponse.statusCode}`
        });
      } catch (notFoundError) {
        this.addTestResult('404 Error Page', {
          status: 'FAIL',
          details: '404 page not accessible'
        });
      }
      
      // Test 500 error handling
      try {
        const errorResponse = await this.makeRequest(`${this.baseUrl}/api/error`);
        const hasCustomError = errorResponse.body.includes('error') || errorResponse.body.includes('Error');
        
        this.addTestResult('500 Error Handling', {
          status: hasCustomError ? 'PASS' : 'SKIP',
          hasCustomError,
          statusCode: errorResponse.statusCode,
          details: `500 error handling: custom=${hasCustomError}, status=${errorResponse.statusCode}`
        });
      } catch (errorError) {
        this.addTestResult('500 Error Handling', {
          status: 'SKIP',
          details: 'Error endpoint not available'
        });
      }
      
      // Test user-friendly error messages
      const response = await this.makeRequest(this.baseUrl);
      const body = response.body;
      const hasErrorHandling = body.includes('try') || body.includes('catch') || body.includes('error');
      const hasUserFriendlyMessages = body.includes('message') || body.includes('alert');
      
      this.addTestResult('Error Message Quality', {
        status: hasErrorHandling ? 'PASS' : 'WARN',
        hasErrorHandling,
        hasUserFriendlyMessages,
        details: `Error handling: present=${hasErrorHandling}, user-friendly=${hasUserFriendlyMessages}`
      });
      
    } catch (error) {
      this.addTestResult('Error Handling', {
        status: 'FAIL',
        error: error.message,
        details: 'Error handling test failed'
      });
    }
  }

  addTestResult(testName, result) {
    this.testResults.push({
      testName,
      timestamp: new Date().toISOString(),
      ...result
    });
    
    const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : result.status === 'WARN' ? '⚠️' : '⏭️';
    console.log(`${status} ${testName}: ${result.details}`);
  }

  async generateWebsiteTestReport() {
    console.log('\n📋 Generating Comprehensive Website Test Report...');
    console.log('=' .repeat(70));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(test => test.status === 'PASS').length;
    const failedTests = this.testResults.filter(test => test.status === 'FAIL').length;
    const warningTests = this.testResults.filter(test => test.status === 'WARN').length;
    const skippedTests = this.testResults.filter(test => test.status === 'SKIP').length;
    
    const successRate = ((passedTests / totalTests) * 100).toFixed(2);
    
    // Calculate performance metrics
    const avgLoadTime = this.performanceMetrics.loadTimes.length > 0 
      ? this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.loadTimes.length
      : 0;
    
    const avgResponseTime = this.performanceMetrics.responseTimes.length > 0
      ? this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.responseTimes.length
      : 0;
    
    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        warningTests,
        skippedTests,
        successRate: `${successRate}%`,
        avgLoadTime: `${avgLoadTime.toFixed(2)}ms`,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
        testDuration: 'Comprehensive website testing completed'
      },
      testResults: this.testResults,
      performanceMetrics: this.performanceMetrics,
      recommendations: this.generateWebsiteRecommendations(),
      websiteScore: this.calculateWebsiteScore()
    };
    
    // Save report to file
    const fs = require('fs');
    fs.writeFileSync('./website_test_report.json', JSON.stringify(report, null, 2));
    
    // Display summary
    console.log('\n🌐 COMPREHENSIVE WEBSITE TESTING SUMMARY');
    console.log('=' .repeat(70));
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️ Warnings: ${warningTests}`);
    console.log(`⏭️ Skipped: ${skippedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⚡ Avg Load Time: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`🔗 Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Website Score: ${report.websiteScore}/100`);
    console.log('=' .repeat(70));
    
    // Display recommendations
    if (report.recommendations.length > 0) {
      console.log('\n🔧 WEBSITE RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.action}: ${rec.details}`);
      });
    }
    
    console.log('\n📄 Detailed report saved to: website_test_report.json');
    
    return report;
  }

  generateWebsiteRecommendations() {
    const recommendations = [];
    
    const failedTests = this.testResults.filter(test => test.status === 'FAIL');
    if (failedTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Fix Failed Tests',
        details: `${failedTests.length} critical issues need immediate attention`
      });
    }
    
    const warningTests = this.testResults.filter(test => test.status === 'WARN');
    if (warningTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Address Warnings',
        details: `${warningTests.length} warnings should be addressed for better performance`
      });
    }
    
    const avgLoadTime = this.performanceMetrics.loadTimes.length > 0 
      ? this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.loadTimes.length
      : 0;
    
    if (avgLoadTime > 3000) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Optimize Performance',
        details: `Average load time is ${avgLoadTime.toFixed(2)}ms, should be under 3000ms`
      });
    }
    
    // Check for missing SEO elements
    const hasTitle = this.testResults.some(test => test.testName.includes('SEO') && test.hasTitle);
    const hasMetaDesc = this.testResults.some(test => test.testName.includes('SEO') && test.hasMetaDescription);
    
    if (!hasTitle || !hasMetaDesc) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Improve SEO',
        details: 'Missing SEO elements like title or meta description'
      });
    }
    
    return recommendations;
  }

  calculateWebsiteScore() {
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
    
    // Bonus for excellent performance
    const avgLoadTime = this.performanceMetrics.loadTimes.length > 0 
      ? this.performanceMetrics.loadTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.loadTimes.length
      : 0;
    
    if (avgLoadTime < 1000) {
      score += 5; // Bonus for excellent performance
    }
    
    // Ensure score doesn't go below 0 or above 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

// Execute tests
async function runWebsiteTests() {
  const tester = new WebsiteTester();
  
  try {
    await tester.runComprehensiveWebsiteTests();
  } catch (error) {
    console.error('❌ Website testing failed:', error);
  }
}

// Export for use
module.exports = { WebsiteTester, runWebsiteTests };

// Run if called directly
if (require.main === module) {
  runWebsiteTests();
}
