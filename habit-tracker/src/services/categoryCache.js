// Category cache service for better performance
import { getCategories, createCategory as createCategoryService } from './categories'

class CategoryCache {
  constructor() {
    this.cache = null
    this.lastFetch = null
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  async getCategories() {
    const now = Date.now()
    
    // Return cached data if it's still fresh
    if (this.cache && this.lastFetch && (now - this.lastFetch) < this.cacheTimeout) {
      return this.cache
    }

    // Fetch fresh data
    try {
      this.cache = await getCategories()
      this.lastFetch = now
      return this.cache
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Return stale cache if available, otherwise empty array
      return this.cache || []
    }
  }

  async createCategory(name, color = "#e5e7eb") {
    try {
      console.log('Creating category:', { name, color }) // Debug log
      const newCategory = await createCategoryService(name, color)
      console.log('Category created successfully:', newCategory) // Debug log
      
      // Ensure cache is initialized and add to cache
      if (!this.cache) {
        this.cache = []
      }
      this.cache.push(newCategory)
      console.log('Added to cache, cache now has:', this.cache.length, 'items') // Debug log
      
      return newCategory
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  // Invalidate cache (call when categories are updated elsewhere)
  invalidate() {
    this.cache = null
    this.lastFetch = null
  }

  // Force refresh
  async refresh() {
    this.invalidate()
    return this.getCategories()
  }
}

// Export singleton instance
export const categoryCache = new CategoryCache()
