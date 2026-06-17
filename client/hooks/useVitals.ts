import { useEffect } from "react";
import { fetchLatestVitals } from "../src/services/vitals";
import useVitalsStore from "../src/store/vitalsStore";

export const useVitals = () => {
  const { latestVitals, isLoading, setLatestVitals, setLoading } = useVitalsStore();
  

  useEffect(() => {
    const loadInitialVitals = async () => {
    

      console.log("useVitals: loading initial vitals from REST API");
      setLoading(true);

      try {
        const vitals = await fetchLatestVitals();
        

        if (vitals) {
          setLatestVitals(vitals);
          console.log("useVitals: initial vitals loaded successfully");
        } else {
          console.log("useVitals: no vitals recorded yet");
          
        }
      } catch (error) {
        console.error("useVitals: failed to load vitals:", error);
        
      } finally {
        setLoading(false);
        
      }
    };

    loadInitialVitals();
  }, []);


  return { latestVitals, isLoading };
  
};