import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getSmartPOISuggestions, findNearbyPOI } from '../../src/services/poiSearch.js';

// Mock axios
vi.mock('axios');

describe('POI Search Service (poiSearch.js)', () => {

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Suppress console logs for cleaner test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getSmartPOISuggestions', () => {

    const destinationName = 'Radhošť';
    const coordinates = { lat: 49.4888, lng: 18.2138 };
    const hardcodedSuggestions = ['Hardcoded Parkoviště 1', 'Hardcoded Parkoviště 2'];

    it('should return dynamic results from Google API when available', async () => {
      const mockApiResponse = {
        data: {
          status: 'OK',
          results: [
            { name: 'Pustevny parkoviště', vicinity: 'Prostřední Bečva' },
            { name: 'Parkoviště u hotelu Ráztoka', vicinity: 'Trojanovice' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockApiResponse);

      const suggestions = await getSmartPOISuggestions(destinationName, 'vague:parking', coordinates, hardcodedSuggestions);

      expect(axios.get).toHaveBeenCalledOnce();
      expect(suggestions).toHaveLength(2);
      expect(suggestions[0]).toContain('Pustevny parkoviště');
      expect(suggestions[0]).toContain('(parkoviště)');
    });

    it('should fall back to hardcoded suggestions if Google API fails', async () => {
      // Simulate API failure
      axios.get.mockRejectedValue(new Error('Network Error'));

      const suggestions = await getSmartPOISuggestions(destinationName, 'vague:parking', coordinates, hardcodedSuggestions);

      expect(axios.get).toHaveBeenCalledOnce();
      expect(suggestions).toEqual(hardcodedSuggestions);
    });

    it('should fall back to hardcoded suggestions if Google API returns ZERO_RESULTS', async () => {
      const mockApiResponse = {
        data: { status: 'ZERO_RESULTS', results: [] }
      };
      axios.get.mockResolvedValue(mockApiResponse);

      const suggestions = await getSmartPOISuggestions(destinationName, 'vague:parking', coordinates, hardcodedSuggestions);

      // It will try nearby search, then text search
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(suggestions).toEqual(hardcodedSuggestions);
    });

    it('should use only hardcoded suggestions if no coordinates are provided', async () => {
      const suggestions = await getSmartPOISuggestions(destinationName, 'vague:parking', null, hardcodedSuggestions);

      expect(axios.get).not.toHaveBeenCalled();
      expect(suggestions).toEqual(hardcodedSuggestions);
    });

    it('should return a generic message as a last resort', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));
      const suggestions = await getSmartPOISuggestions(destinationName, 'vague:parking', coordinates, []); // No hardcoded suggestions

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0]).toBe(`Nejbližší parkoviště v oblasti ${destinationName}`);
    });
  });

  describe('findNearbyPOI (Bug Fix Verification)', () => {

    it('should use strict location biasing to search near the destination, not the user\'s IP', async () => {
      const destinationCoords = { lat: 49.4888, lng: 18.2138 }; // Radhošť
      const mockApiResponse = {
        data: {
          status: 'OK',
          results: [{ name: 'Parkoviště Pustevny' }]
        }
      };
      axios.get.mockResolvedValue(mockApiResponse);

      await findNearbyPOI(destinationCoords, 'Radhošť', 'vague:parking');

      expect(axios.get).toHaveBeenCalledOnce();
      const calledParams = axios.get.mock.calls[0][1].params;

      // Verify the critical fix from Code Review is present
      expect(calledParams.locationbias).toBe(`circle:10000@${destinationCoords.lat},${destinationCoords.lng}`);
      expect(calledParams.strictbounds).toBe(true);
      expect(calledParams.location).toBe(`${destinationCoords.lat},${destinationCoords.lng}`);
    });
  });

  describe('Input Validation', () => {

    it('should return an empty array if coordinates are null or invalid', async () => {
      const resultNull = await findNearbyPOI(null, 'Test', 'vague:parking');
      const resultUndefined = await findNearbyPOI(undefined, 'Test', 'vague:parking');
      const resultInvalid = await findNearbyPOI({ lat: 'abc', lng: 'def' }, 'Test', 'vague:parking');

      expect(resultNull).toEqual([]);
      expect(resultUndefined).toEqual([]);
      expect(resultInvalid).toEqual([]);
      expect(axios.get).not.toHaveBeenCalled();
    });

    // Validation now implemented - test passes!
    it('should return an empty array for out-of-range coordinates', async () => {
      const result = await findNearbyPOI({ lat: 91, lng: 181 }, 'Test', 'vague:parking');
      expect(result).toEqual([]);
      expect(axios.get).not.toHaveBeenCalled();
    });
  });
});
