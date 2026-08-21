import { useState, useEffect, createContext, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // Added this import
import { ArrowLeft } from "lucide-react";


// Navigation Components
import TopNavigation from "@/components1/NewUI/navigation/TopNavigation";
import BottomNavigation from "@/components1/NewUI/navigation/BottomNavigation";
import ModeSwitchDialog from "@/components1/NewUI/ModeSwitchDialog";

// Individual View Components
import IndividualHero from "@/components1/NewUI/individual/IndividualHero";
import IndividualServices from "@/components1/NewUI/individual/IndividualServices";
// import IndividualJourney from "@/components1/NewUI/individual/IndividualJourney";
// import IndividualPricing from "@/components1/NewUI/individual/IndividualPricing";
import IndividualFAQ from "@/components1/NewUI/individual/IndividualFAQ";
import IndividualCTA from "@/components1/NewUI/individual/IndividualCTA";

// Institutional View Components
import InstitutionalHero from "@/components1/NewUI/institutional/InstitutionalHero";
import InstitutionalModules from "@/components1/NewUI/institutional/InstitutionalModules";
// import HowWePartner from "@/components1/NewUI/institutional/HowWePartner";
// import InstitutionalPricing from "@/components1/NewUI/institutional/InstitutionalPricing";
import InstitutionalFAQ from "@/components1/NewUI/institutional/InstitutionalFAQ";
import InstitutionalCTA from "@/components1/NewUI/institutional/InstitutionalCTA";

// Enquiry Popup
import EnquiryPopup, { EnquiryMode } from "@/components1/NewUI/EnquiryPopup";
import Header from "@/components1/Header";
import Footer from "@/components1/Footer";

export type Mode = "individual" | "institution";

// Context for enquiry popup
interface EnquiryContextType {
  openEnquiry: (service?: string) => void;
  closeEnquiry: () => void;
}

export const EnquiryContext = createContext<EnquiryContextType>({
  openEnquiry: () => {},
  closeEnquiry: () => {},
});

export const useEnquiry = () => useContext(EnquiryContext);

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  /**
   * Return to wherever the visitor came from, falling back to the homepage.
   * React Router tracks its position in history as `idx`; at 0 there is
   * nothing of ours to go back to - a deep link, or a fresh tab - and calling
   * history.back() there would drop the visitor off the site entirely.
   */
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/");
  };

  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "institution" || modeParam === "individual") 
    ? modeParam 
    : "individual";

  /**
   * Ask before crossing between the two views. Individual and Institutional
   * list different services at different prices, so an unannounced switch made
   * it easy to read one sides pricing as the others.
   */
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);

  const applyMode = (newMode: Mode) => {
    setSearchParams({ mode: newMode }, { replace: true });
  };

  const setMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setPendingMode(newMode);
  };

  const [activeSection, setActiveSection] = useState<string>("services");
  
  // Enquiry popup state
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>("");

  const openEnquiry = (service?: string) => {
    if (service) {
      setSelectedService(service);
    }
    setIsEnquiryOpen(true);
  };

  const closeEnquiry = () => {
    setIsEnquiryOpen(false);
    setSelectedService("");
  };

  // Scroll spy to track active section
  useEffect(() => {
    const ids = ["services", "process", "plans", "faq"];
    
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: "-40% 0px -40% 0px",
      threshold: 0.1,
    });

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, [mode]);

  return (
    <EnquiryContext.Provider value={{ openEnquiry, closeEnquiry }}>
      <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-[Poppins]">
        {/* Background Effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-slate-50" />
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-blue-100/20 to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-emerald-100/20 to-transparent opacity-50" />
        </div>
        
        

        {/* This page is reached from several places and had no way back.
            Floated rather than placed in the flow: the pages own chrome (the
            top pill and the bottom bar) is all fixed, and a block here pushed
            every section down by its own height. Sits at the same top-6 as the
            mode switcher so the two read as one row. The label collapses on
            narrow screens, where the centred pill comes close to the edge. */}
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="fixed left-4 top-6 z-[60] flex h-[45px] items-center gap-2 rounded-full bg-white/90 px-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-900/10 backdrop-blur transition hover:bg-white hover:text-slate-900 sm:left-6 sm:px-4"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Back</span>
        </button>

        {/* Confirms a move between the Individual and Institutional views */}
        <ModeSwitchDialog
          pendingMode={pendingMode}
          onConfirm={() => {
            if (pendingMode) applyMode(pendingMode);
            setPendingMode(null);
          }}
          onCancel={() => setPendingMode(null)}
        />

        {/* Top Navigation */}
        <TopNavigation mode={mode} setMode={setMode} />

        {/* Bottom Navigation */}
        <BottomNavigation mode={mode} activeSection={activeSection} />

        {/* Main Content */}
        <main className="relative z-10 w-full max-w-[1600px] mx-auto bg-white rounded-none sm:rounded-[2rem] md:rounded-[0rem] shadow-2xl overflow-hidden ring-1 ring-slate-900/5 md:mt-0 md:mb-32">
          {mode === "individual" ? (
            // Individual View
            <div className="transition-opacity duration-300">
              <IndividualHero />
              <IndividualServices />
              {/* <IndividualJourney /> */}
              {/* <IndividualPricing /> */}
              <IndividualFAQ />
              <IndividualCTA />
              <Footer />
            </div>
          ) : (
            // Institutional View
            <div className="transition-opacity duration-300">
              <InstitutionalHero />
              <InstitutionalModules />
              {/* <HowWePartner /> */}
              <InstitutionalFAQ />
              <InstitutionalCTA />
              <Footer />
            </div>
          )}
        </main>
        
        {/* Enquiry Popup */}
        <EnquiryPopup
          isOpen={isEnquiryOpen}
          onClose={closeEnquiry}
          mode={mode as EnquiryMode}
          preSelectedService={selectedService}
        />
        
        
      </div>
      
    </EnquiryContext.Provider>
  );
};

export default Index;