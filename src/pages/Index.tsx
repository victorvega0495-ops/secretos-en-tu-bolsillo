import { useEffect } from "react";
import CampaignSection from "@/components/CampaignSection";

const Index = () => {
  useEffect(() => {
    document.title = "Secretos de Ventas | Price Shoes";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CampaignSection />
    </div>
  );
};

export default Index;
