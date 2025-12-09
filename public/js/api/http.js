// public/js/api/http.js
// Base HTTP client for all requests to json-server

(function (global) {
  const API_BASE_URL = 'http://localhost:3001'; // json-server URL

  class HttpClient {
    constructor(baseURL) {
      this.client = axios.create({
        baseURL,
        headers: { 'Content-Type': 'application/json' }
      });

      // very simple in-memory cache: key -> data
      this.cache = new Map();
    }

    _getCacheKey(method, url, config) {
      const params = config && config.params ? config.params : null;
      return `${method}:${url}:${JSON.stringify(params)}`;
    }

    async get(url, config = {}) {
      const { useCache = false, ...axiosConfig } = config;
      const cacheKey = this._getCacheKey('GET', url, axiosConfig);

      if (useCache && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const response = await this.client.get(url, axiosConfig);
      const data = response.data;

      if (useCache) {
        this.cache.set(cacheKey, data);
      }

      return data;
    }

    async post(url, data, config = {}) {
      const response = await this.client.post(url, data, config);
      return response.data;
    }

    async put(url, data, config = {}) {
      const response = await this.client.put(url, data, config);
      return response.data;
    }

    async delete(url, config = {}) {
      const response = await this.client.delete(url, config);
      return response.data;
    }
  }

  // expose single shared instance
  global.httpClient = new HttpClient(API_BASE_URL);
})(window);
