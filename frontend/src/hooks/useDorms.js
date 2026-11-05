import { useCallback, useEffect, useState } from "react";
import { searchDormitories, getRecommendedDormitories } from "../api/dormApi.js";

export const initialFilters = {
  query: "",
  dormitoryType: "",
  minPrice: "",
  maxPrice: "",
};

export default function useDorms() {
  const [filters, setFilters] = useState(initialFilters);
  const [results, setResults] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadResults = useCallback(async (searchFilters) => {
    setLoading(true);
    setError("");
    setRecommendations([]);
    try {
      const searchResults = await searchDormitories(searchFilters);
      setResults(searchResults);
      if (searchResults.length === 0) {
        setRecommendations(await getRecommendedDormitories(searchFilters));
      }
    } catch (e) {
      setResults([]);
      setRecommendations([]);
      setError(e.message || "ไม่สามารถโหลดรายการหอพักได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults(initialFilters);
  }, [loadResults]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function submitSearch(event) {
    event.preventDefault();
    loadResults(filters);
  }

  // รองรับ FR-DOR-06
  function clearFilters() {
    setFilters(initialFilters);
    loadResults(initialFilters);
  }

  return {
    filters,
    results,
    recommendations,
    displayedResults: results.length > 0 ? results : recommendations,
    loading,
    error,
    updateFilter,
    submitSearch,
    clearFilters,
  };
}