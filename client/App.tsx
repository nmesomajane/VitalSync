import { StatusBar} from "expo-status-bar";
import AppNavigator from "./src/navigation/AppNavigator";
import { JSX } from "react";

console.log("App.tsx loaded — VitalSync starting");

export default function App(): JSX.Element {
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}