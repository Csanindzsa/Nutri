import React, { createContext, useContext, ReactNode, useState } from "react";
import CarrotBackground from "../components/CarrotBackground";

interface BackgroundContextType {
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundSize: (size: string) => void;
  opacity: number;
  backgroundSize: string;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(
  undefined
);

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return context;
};

interface BackgroundProviderProps {
  children: ReactNode;
}

export const BackgroundProvider: React.FC<BackgroundProviderProps> = ({
  children,
}) => {
  // Changed default size from "200px" to "cover"
  const [opacity, setOpacity] = useState(0.5);
  const [backgroundSize, setBackgroundSize] = useState("cover");

  const value = {
    opacity,
    backgroundSize,
    setBackgroundOpacity: setOpacity,
    setBackgroundSize,
  };

  return (
    <BackgroundContext.Provider value={value}>
      <CarrotBackground opacity={opacity} backgroundSize={backgroundSize}>
        {children}
      </CarrotBackground>
    </BackgroundContext.Provider>
  );
};
