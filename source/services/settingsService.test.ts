/**
 * Unit tests for settingsService
 * Tests settings read/write operations with mocked fileService
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as fileService from './fileService.js'
import type { Settings } from '../types/index.js'

vi.mock('./fileService.js')

const mockReadJsonFile = vi.mocked(fileService.readJsonFile)
const mockWriteJsonFile = vi.mocked(fileService.writeJsonFile)

// Import after mocking
import {
  readSettings,
  writeSettings,
  getEnabledPlugins,
  isPluginEnabled,
  setPluginEnabled,
  enablePlugin,
  disablePlugin,
  togglePlugin,
  getPluginStats,
} from './settingsService.js'

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('readSettings', () => {
    it('should throw when settings.json not found', () => {
      mockReadJsonFile.mockReturnValue(null)

      expect(() => readSettings()).toThrow(
        /settings\.json not found.*Is Claude Code installed\?/,
      )
    })

    it('should return settings when file exists', () => {
      const mockSettings: Settings = {
        enabledPlugins: {
          'context7@claude-plugins-official': true,
        },
      }
      mockReadJsonFile.mockReturnValue(mockSettings)

      const result = readSettings()

      expect(result).toEqual(mockSettings)
      expect(mockReadJsonFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('writeSettings', () => {
    it('should write settings to file', () => {
      const settings: Settings = {
        enabledPlugins: {
          'my-plugin@marketplace': true,
        },
      }

      writeSettings(settings)

      expect(mockWriteJsonFile).toHaveBeenCalledTimes(1)
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        settings,
      )
    })
  })

  describe('getEnabledPlugins', () => {
    it('should return empty object when no enabledPlugins', () => {
      mockReadJsonFile.mockReturnValue({} as Settings)

      const result = getEnabledPlugins()

      expect(result).toEqual({})
    })

    it('should return empty object when enabledPlugins is undefined', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: undefined,
      } as Settings)

      const result = getEnabledPlugins()

      expect(result).toEqual({})
    })

    it('should return enabledPlugins map', () => {
      const enabledPlugins = {
        'plugin-a@market': true,
        'plugin-b@market': false,
      }
      mockReadJsonFile.mockReturnValue({ enabledPlugins } as Settings)

      const result = getEnabledPlugins()

      expect(result).toEqual(enabledPlugins)
    })
  })

  describe('isPluginEnabled', () => {
    it('should return true when plugin is enabled', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {
          'context7@claude-plugins-official': true,
        },
      } as Settings)

      const result = isPluginEnabled('context7@claude-plugins-official')

      expect(result).toBe(true)
    })

    it('should return false when plugin is disabled', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {
          'my-plugin@marketplace': false,
        },
      } as Settings)

      const result = isPluginEnabled('my-plugin@marketplace')

      expect(result).toBe(false)
    })

    it('should return false when plugin is not found', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {},
      } as Settings)

      const result = isPluginEnabled('nonexistent@marketplace')

      expect(result).toBe(false)
    })

    it('should return false when enabledPlugins is undefined', () => {
      mockReadJsonFile.mockReturnValue({} as Settings)

      const result = isPluginEnabled('any-plugin@marketplace')

      expect(result).toBe(false)
    })
  })

  describe('setPluginEnabled', () => {
    it('should create enabledPlugins if missing', () => {
      const settings: Settings = {}
      mockReadJsonFile.mockReturnValue(settings)

      setPluginEnabled('new-plugin@marketplace', true)

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        {
          enabledPlugins: {
            'new-plugin@marketplace': true,
          },
        },
      )
    })

    it('should update existing enabledPlugins', () => {
      const settings: Settings = {
        enabledPlugins: {
          'existing-plugin@marketplace': true,
        },
      }
      mockReadJsonFile.mockReturnValue(settings)

      setPluginEnabled('new-plugin@marketplace', false)

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        {
          enabledPlugins: {
            'existing-plugin@marketplace': true,
            'new-plugin@marketplace': false,
          },
        },
      )
    })

    it('should overwrite existing plugin state', () => {
      const settings: Settings = {
        enabledPlugins: {
          'my-plugin@marketplace': true,
        },
      }
      mockReadJsonFile.mockReturnValue(settings)

      setPluginEnabled('my-plugin@marketplace', false)

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        {
          enabledPlugins: {
            'my-plugin@marketplace': false,
          },
        },
      )
    })
  })

  describe('enablePlugin', () => {
    it('should enable a plugin', () => {
      const settings: Settings = { enabledPlugins: {} }
      mockReadJsonFile.mockReturnValue(settings)

      enablePlugin('my-plugin@marketplace')

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        {
          enabledPlugins: {
            'my-plugin@marketplace': true,
          },
        },
      )
    })
  })

  describe('disablePlugin', () => {
    it('should disable a plugin', () => {
      const settings: Settings = {
        enabledPlugins: {
          'my-plugin@marketplace': true,
        },
      }
      mockReadJsonFile.mockReturnValue(settings)

      disablePlugin('my-plugin@marketplace')

      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        {
          enabledPlugins: {
            'my-plugin@marketplace': false,
          },
        },
      )
    })
  })

  describe('togglePlugin', () => {
    it('should toggle plugin from enabled to disabled and return new state', () => {
      // First call for isPluginEnabled check
      mockReadJsonFile.mockReturnValueOnce({
        enabledPlugins: {
          'my-plugin@marketplace': true,
        },
      } as Settings)
      // Second call for setPluginEnabled
      mockReadJsonFile.mockReturnValueOnce({
        enabledPlugins: {
          'my-plugin@marketplace': true,
        },
      } as Settings)

      const result = togglePlugin('my-plugin@marketplace')

      expect(result).toBe(false)
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.objectContaining({
          enabledPlugins: expect.objectContaining({
            'my-plugin@marketplace': false,
          }),
        }),
      )
    })

    it('should toggle plugin from disabled to enabled and return new state', () => {
      // First call for isPluginEnabled check
      mockReadJsonFile.mockReturnValueOnce({
        enabledPlugins: {
          'my-plugin@marketplace': false,
        },
      } as Settings)
      // Second call for setPluginEnabled
      mockReadJsonFile.mockReturnValueOnce({
        enabledPlugins: {
          'my-plugin@marketplace': false,
        },
      } as Settings)

      const result = togglePlugin('my-plugin@marketplace')

      expect(result).toBe(true)
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.objectContaining({
          enabledPlugins: expect.objectContaining({
            'my-plugin@marketplace': true,
          }),
        }),
      )
    })

    it('should toggle non-existent plugin to enabled', () => {
      // First call for isPluginEnabled check (returns false for non-existent)
      mockReadJsonFile.mockReturnValueOnce({
        enabledPlugins: {},
      } as Settings)
      // Second call for setPluginEnabled
      mockReadJsonFile.mockReturnValueOnce({
        enabledPlugins: {},
      } as Settings)

      const result = togglePlugin('new-plugin@marketplace')

      expect(result).toBe(true)
      expect(mockWriteJsonFile).toHaveBeenCalledWith(
        expect.stringContaining('settings.json'),
        expect.objectContaining({
          enabledPlugins: expect.objectContaining({
            'new-plugin@marketplace': true,
          }),
        }),
      )
    })
  })

  describe('getPluginStats', () => {
    it('should calculate counts correctly', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {
          'plugin-a@market': true,
          'plugin-b@market': true,
          'plugin-c@market': false,
          'plugin-d@market': true,
          'plugin-e@market': false,
        },
      } as Settings)

      const stats = getPluginStats()

      expect(stats).toEqual({
        total: 5,
        enabled: 3,
        disabled: 2,
      })
    })

    it('should return zeros when no plugins', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {},
      } as Settings)

      const stats = getPluginStats()

      expect(stats).toEqual({
        total: 0,
        enabled: 0,
        disabled: 0,
      })
    })

    it('should return zeros when enabledPlugins is undefined', () => {
      mockReadJsonFile.mockReturnValue({} as Settings)

      const stats = getPluginStats()

      expect(stats).toEqual({
        total: 0,
        enabled: 0,
        disabled: 0,
      })
    })

    it('should count all enabled when no disabled plugins', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {
          'plugin-a@market': true,
          'plugin-b@market': true,
        },
      } as Settings)

      const stats = getPluginStats()

      expect(stats).toEqual({
        total: 2,
        enabled: 2,
        disabled: 0,
      })
    })

    it('should count all disabled when no enabled plugins', () => {
      mockReadJsonFile.mockReturnValue({
        enabledPlugins: {
          'plugin-a@market': false,
          'plugin-b@market': false,
        },
      } as Settings)

      const stats = getPluginStats()

      expect(stats).toEqual({
        total: 2,
        enabled: 0,
        disabled: 2,
      })
    })
  })
})
