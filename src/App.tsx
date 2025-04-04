import React, { useState, useEffect } from 'react';
import { Upload, Play, Pause, RefreshCw, Link, Clock } from 'lucide-react';

interface SitemapUrl {
  url: string;
  visited: boolean;
}

function App() {
  const [sitemapContent, setSitemapContent] = useState<string>('');
  const [urls, setUrls] = useState<SitemapUrl[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [timeDelay, setTimeDelay] = useState<number>(30);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [nextPageCountdown, setNextPageCountdown] = useState<number>(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState<string>('');

  const parseSitemap = (content: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    const locations = xmlDoc.getElementsByTagName('loc');
    return Array.from(locations).map(loc => ({
      url: loc.textContent || '',
      visited: false
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSitemapContent(content);
        setUrls(parseSitemap(content));
        setCurrentIndex(-1);
        setError('');
      };
      reader.readAsText(file);
    }
  };

  const fetchSitemap = async (url: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch sitemap');
      }
      
      const content = await response.text();
      setSitemapContent(content);
      setUrls(parseSitemap(content));
      setCurrentIndex(-1);
    } catch (err) {
      setError('Failed to fetch sitemap. Please check the URL and try again.');
      setUrls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sitemapUrl) {
      fetchSitemap(sitemapUrl);
    }
  };

  const handleTimeDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isProcessing && value >= 20) {
      setTimeDelay(value);
    }
  };

  const processNextUrl = async () => {
    if (currentIndex < urls.length - 1 && !isPaused) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      window.open(urls[nextIndex].url, '_blank');
      
      setUrls(prev => prev.map((url, idx) => 
        idx === nextIndex ? { ...url, visited: true } : url
      ));
    } else if (currentIndex === urls.length - 1) {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    if (isProcessing && !isPaused && currentIndex < urls.length - 1) {
      setNextPageCountdown(timeDelay);
      
      countdownTimer = setInterval(() => {
        setNextPageCountdown(prev => Math.max(0, prev - 1));
      }, 1000);

      timer = setTimeout(processNextUrl, timeDelay * 1000);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [currentIndex, isProcessing, isPaused, urls.length, timeDelay]);

  useEffect(() => {
    if (isProcessing && !isPaused) {
      const remainingUrls = urls.length - (currentIndex + 1);
      const totalSeconds = remainingUrls * timeDelay;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const timeString = [];
      if (hours > 0) timeString.push(`${hours}h`);
      if (minutes > 0) timeString.push(`${minutes}m`);
      if (seconds > 0) timeString.push(`${seconds}s`);

      setEstimatedTimeLeft(timeString.join(' '));
    } else {
      setEstimatedTimeLeft('');
    }
  }, [currentIndex, isProcessing, isPaused, urls.length, timeDelay]);

  const startProcessing = () => {
    setShowPermissionDialog(true);
  };

  const confirmStart = () => {
    setShowPermissionDialog(false);
    setIsProcessing(true);
    setIsPaused(false);
    if (currentIndex === -1) {
      processNextUrl();
    }
  };

  const resetProcess = () => {
    setUrls(prev => prev.map(url => ({ ...url, visited: false })));
    setCurrentIndex(-1);
    setIsProcessing(false);
    setIsPaused(false);
    setEstimatedTimeLeft('');
    setNextPageCountdown(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
            Brizy Cloud Cache Generator
          </h1>
          
          <div className="space-y-4 sm:space-y-6 mb-8">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    value={sitemapUrl}
                    onChange={(e) => setSitemapUrl(e.target.value)}
                    placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Link className="w-4 h-4" />
                  {isLoading ? 'Loading...' : 'Fetch'}
                </button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <label className="flex flex-col items-center px-4 py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Upload sitemap.xml</span>
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Time Delay:</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  value={timeDelay}
                  onChange={handleTimeDelayChange}
                  disabled={isProcessing}
                  className="w-24 px-3 py-1 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {urls.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  {!isProcessing ? (
                    <button
                      onClick={startProcessing}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Processing
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className={`${
                        isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
                      } text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2`}
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={resetProcess}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Progress: {urls.filter(url => url.visited).length} / {urls.length}</div>
                  {isProcessing && !isPaused && (
                    <>
                      <div>Next page opens in: {nextPageCountdown}s</div>
                      <div>Estimated time remaining: {estimatedTimeLeft}</div>
                    </>
                  )}
                  {currentIndex === urls.length - 1 && urls[currentIndex]?.visited && (
                    <div className="text-green-600 font-semibold">All pages processed!</div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-y-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {urls.map((url, index) => (
                        <tr key={index} className={index === currentIndex ? 'bg-blue-50' : ''}>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-lg">
                            {url.url}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                            {url.visited ? (
                              <span className="text-green-600">Visited</span>
                            ) : index === currentIndex ? (
                              <span className="text-blue-600">Processing</span>
                            ) : (
                              <span className="text-gray-400">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <footer className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Developed by <a href="https://www.wpsitedoctors.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">WP Site Doctors</a>
        </footer>
      </div>

      {/* Permission Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Permission Required</h3>
            <p className="text-gray-600 mb-6">
              This process will open multiple tabs in your browser to generate cache. Please ensure your browser allows popup windows for this site.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Allow and Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;