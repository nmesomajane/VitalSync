import * as React from 'react'
import { Tabs } from "expo-router"
import index from "."


const TabsLayout: React.FC = () => {
    return (
       <Tabs >
      <Tabs.Screen name="index"options={{headerTitle:index,
        title:"index",
      }} /> 
      </Tabs>  
    )
}


export default TabsLayout
