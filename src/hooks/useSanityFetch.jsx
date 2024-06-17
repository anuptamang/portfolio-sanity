import { useEffect, useState } from "react";
import sanityClient from "../client";

const useSanityFetch = (query, cacheKey, updatedAtQuery) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdatedAt = async () => {
      const { updatedAt } = await sanityClient.fetch(updatedAtQuery);
      return updatedAt;
    };

    const fetchData = async () => {
      const updatedAt = await fetchUpdatedAt();
      const cache = JSON.parse(localStorage.getItem(cacheKey));
      if (new Date(updatedAt).getTime() <= cache?.timestamp) {
        setData(cache.data);
        setLoading(false);
        return;
      }
      try {
        const result = await sanityClient.fetch(query);
        setData(result);
        // Save to local storage with timestamp
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data: result, timestamp: Date.now() })
        );
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [query, cacheKey, updatedAtQuery]);

  return { data, error, loading };
};

export default useSanityFetch;
