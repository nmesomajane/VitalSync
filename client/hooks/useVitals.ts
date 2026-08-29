import { useEffect } from "react";
import { fetchLatestVitals } from "../src/services/vitals";
import useVitalsStore from "../src/store/vitalsStore";

export const useVitals = () => {
  const {
    latestVitals,
    isLoading,
    setLatestVitals,
    setLoading,
  } = useVitalsStore();

  useEffect(() => {
    const loadInitialVitals = async () => {
      console.log("🟡 useVitals: starting to load vitals");

      setLoading(true);

      try {
        console.log("🟡 useVitals: calling fetchLatestVitals()");

        const vitals = await fetchLatestVitals();

        console.log("🟢 useVitals: fetchLatestVitals returned:");
        console.log("🟢 DATA:", vitals);

        if (vitals) {
          console.log("🔵 useVitals: vitals exist, saving to store");
          
          setLatestVitals(vitals);

          console.log("🔵 useVitals: vitals saved to store");
        } else {
          console.log("🟠 useVitals: NO VITALS RECORDED YET");
        }

      } catch (error: any) {
        console.error("🔴 useVitals: FAILED TO LOAD VITALS");

        console.error("🔴 Error message:", error?.message);
        console.error("🔴 HTTP status:", error?.response?.status);
        console.error("🔴 Server response:", error?.response?.data);
        console.error("🔴 Request URL:", error?.config?.url);

      } finally {
        console.log("⚪ useVitals: finished loading");
        setLoading(false);
      }
    };

    console.log("🚀 useVitals: useEffect running");

    loadInitialVitals();
  }, []);

  console.log("📦 useVitals: returning store data:", latestVitals);

  return {
    latestVitals,
    isLoading,
  };
};