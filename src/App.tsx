import { createTheme, MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useEffect, useState, lazy, Suspense } from "react";
import type { ComponentType } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./components/ErrorBoundary";

const AdminApplicationsLayout = lazy(() => import("./layouts/AdminApplicationsLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const PartnerLayout = lazy(() => import("./layouts/PartnerLayout"));
const PartnerSettingsLayout = lazy(() => import("./layouts/PartnerSettingsLayout"));
const AdminBlogs = lazy(() => import("./pages/admin/AdminBlogs"));
const AdminBlogSpotlight = lazy(() => import("./pages/admin/AdminBlogSpotlight"));
const AdminCampusAmbassador = lazy(() => import("./pages/admin/AdminCampusAmbassador"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminInstitutionRegistrations = lazy(() => import("./pages/admin/AdminInstitutionPlan"));
const AdminPartners = lazy(() => import("./pages/admin/AdminParnters"));
const AdminPartnerDetails = lazy(() => import("./pages/admin/AdminPartnerDetails"));
const AdminIndividual = lazy(() => import("./pages/admin/AdminIndividual"));
const AdminSchedules = lazy(() => import("./pages/admin/AdminSchedules"));
const AdminSignIn = lazy(() => import("./pages/admin/AdminSignIn"));
const AdminStudentDetails = lazy(() => import("./pages/admin/AdminStudentDetails"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminTrainings = lazy(() => import("./pages/admin/AdminTrainings"));
const AdminTrainingSpotlight = lazy(() => import("./pages/admin/AdminTrainingSpotlight"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const BlogCreate = lazy(() => import("./pages/BlogCreate"));
const BlogListing = lazy(() => import("./pages/BlogListing"));
const BlogSpotlight = lazy(() => import("./pages/BlogSpotlight"));
const CampusAmbassador = lazy(() => import("./pages/CampusAmbassador"));
const Home = lazy(() => import("./pages/home"));
const Login = lazy(() => import("./pages/Login"));
const PartnerAccounts = lazy(() => import("./pages/partner/PartnerAccount"));
const PartnerCourseDetails = lazy(() => import("./pages/partner/PartnerCourseDetails"));
const PartnerCreateCourse = lazy(() => import("./pages/partner/PartnerCreateCourse"));
const PartnerHome = lazy(() => import("./pages/partner/PartnerHome"));
const PartnerEditCourse = lazy(() => import("./pages/partner/PartnerEditCourse"));
const PartnerSettings = lazy(() => import("./pages/partner/PartnerSettings"));
const PartnerSignIn = lazy(() => import("./pages/partner/PartnerSignIn"));
const PartnerStudents = lazy(() => import("./pages/partner/PartnerStudents"));
const PartnerTrainings = lazy(() => import("./pages/partner/PartnerTrainings"));
const PartnerSignUp = lazy(() => import("./pages/partner/PartnerWithUs"));
const StudentDetails = lazy(() => import("./pages/partner/StudentDetails"));
const ForgotPassword = lazy(() => import("./pages/forgotPassword"));
const PsychologyTraining = lazy(() => import("./pages/PsychologyTraining"));
const SignUp = lazy(() => import("./pages/Signup"));
const Training = lazy(() => import("./pages/Training"));
const TrainingSpotlight = lazy(() => import("./pages/TrainingSpotlight"));
const CareerCounselling = lazy(() => import("./pages/CareerCounselling"));
const AdminCareerCounselling = lazy(() => import("./pages/admin/AdminCareerCounselling"));
const ExploreProgramDashboard = lazy(() => import("./pages/ExploreProgramDashboard"));
const PsychologyCounselling = lazy(() => import("./pages/PsychologyCounselling"));
const InstitutionPricing = lazy(() => import("./pages/InstitutionPricing"));
const CampusAmbassadorDash = lazy(() => import("./pages/CampusAmbassadorDash"));
const CampusAmbassadorBooking = lazy(() => import("./pages/CampusAmbassadorBooking"));
const PartnerRole = lazy(() => import("./pages/PartnerRole"));
const CampusAmbassadorSignup = lazy(() => import("./pages/CampusAmbassadorSignup"));
const InstitutionPortal = lazy(() => import("./pages/PartnerInstitutionPortal"));
const InstitutionLogin = lazy(() => import("./pages/InstitutionLogin"));
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const Community = lazy(() => import("./pages/Community"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const CareerCounsellingBookingFlow = lazy(() => import("./pages/CareerCounsellingBookingFlow"));
const PsychologyBookingFlow = lazy(() => import("./pages/PsychologyBookingFlow"));
const InstitutionBookingFlow = lazy(() => import("./pages/InstitutionBookingFlow"));
const InstitutionOrIndividual = lazy(() => import("./pages/InstitutionOrIndividual"));
const FinishingSchool = lazy(() => import("./pages/FinishingSchool"));
const AcademyDetail = lazy(() => import("./pages/AcademyDetail"));
const SkillDevelopment = lazy(() => import("./pages/SkillDevelopment"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const PrivacyPolicy = lazy(() => import("./components1/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./components1/RefundPolicy"));
const TermsConditions = lazy(() => import("./components1/TermsConditions"));
const ComingSoon = lazy(() => import("./components1/ComingSoon"));
const NotFound = lazy(() => import("./pages/404/NotFound").then(m => ({ default: m.NotFound })));




import { queryClient } from "./lib/api";

































// import PricingPage from "./pages/Pricing";

// import PrivacyPolicy from "./pages/PrivacyPolicy";

// import RefundPolicy from "./pages/RefundPolicy";

































function AppLayout() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Outlet />
      </div>
    </>
  );
}

const theme = createTheme({
  // Use NPM-provided Poppins font globally
  fontFamily: "'Poppins', sans-serif",
  fontFamilyMonospace: "'Poppins', sans-serif",
  headings: { fontFamily: "'Poppins', sans-serif" },
});

function ReactQueryDevtoolsGate() {
  const [Devtools, setDevtools] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    let isMounted = true;

    import("@tanstack/react-query-devtools").then((module) => {
      if (isMounted) {
        setDevtools(() => module.ReactQueryDevtools);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!Devtools) {
    return null;
  }

  return <Devtools />;
}

function App() {
  return (
    <MantineProvider theme={theme}>
      <ErrorBoundary>
        <NuqsAdapter>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route
                  path="/explore-program-dashboard"
                  element={<ExploreProgramDashboard />}
                />
                <Route path="/training" element={<Training />} />
                <Route path="/training/:id" element={<TrainingSpotlight />} />
                <Route path="/blogs" element={<BlogListing />} />
                <Route path="/blogs/:id" element={<BlogSpotlight />} />
                {/* <Route path="/pricing" element={<Home />} /> */}
                <Route path="/community" element={<Community />} />
                <Route path="/coming-soon" element={<ComingSoon />} />

                {/* <Route path="/blogs/new" element={<BlogCreate />} /> */}
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/terms-condition" element={<TermsConditions />} />
                <Route
                  path="/insituion-individual"
                  element={<InstitutionOrIndividual />}
                />
                <Route path="/partner-role" element={<PartnerRole />} />
                <Route
                  path="/campus-ambassador-signup"
                  element={<CampusAmbassadorSignup />}
                />
                <Route
                  path="/partner-institution-signup"
                  element={<InstitutionPortal />}
                />
                <Route path="/partner-signin" element={<InstitutionLogin />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/course-detail/:id" element={<CourseDetail />} />
                <Route
                  path="/skill-development"
                  element={<SkillDevelopment />}
                />
                <Route path="/finishing-school" element={<FinishingSchool />} />
                <Route
                  path="/academy-detail/:courseId"
                  element={<AcademyDetail />}
                />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog-article" element={<BlogArticle />} />
                <Route path="/blog-post/:id" element={<BlogPost />} />
                <Route
                  path="/career-counselling-booking"
                  element={<CareerCounsellingBookingFlow />}
                />
                <Route
                  path="/mental-wellbeing"
                  element={<PsychologyCounselling />}
                />
                <Route
                  path="/career-counselling"
                  element={<CareerCounselling />}
                />
                <Route
                  path="/mental-wellbeing-counselling"
                  element={<PsychologyBookingFlow />}
                />
                <Route
                  path="/institution-booking"
                  element={<InstitutionBookingFlow />}
                />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/institution-pricing"
                  element={<InstitutionPricing />}
                />
                <Route
                  path="/campus-ambassador-booking"
                  element={<CampusAmbassadorBooking />}
                />
                <Route
                  path="/campus-ambassador"
                  element={<CampusAmbassadorDash />}
                />
                <Route path="/ca-program" element={<CampusAmbassador />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="/admin/signin" element={<AdminSignIn />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHome />} />
                <Route path="trainings" element={<AdminTrainings />} />
                <Route
                  path="trainings/:id"
                  element={<AdminTrainingSpotlight />}
                />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="blogs/:id" element={<AdminBlogSpotlight />} />
                <Route path="partners" element={<AdminPartners />} />
                <Route path="partners/:id" element={<AdminPartnerDetails />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="schedules" element={<AdminSchedules />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="students/:id" element={<AdminStudentDetails />} />
                <Route
                  path="applications"
                  element={<AdminApplicationsLayout />}
                >
                  <Route index element={<AdminIndividual />} />
                  <Route
                    path="career-counselling"
                    element={<AdminCareerCounselling />}
                  />
                  <Route
                    path="ca-programs"
                    element={<AdminCampusAmbassador />}
                  />
                  <Route
                    path="institutions"
                    element={<AdminInstitutionRegistrations />}
                  />
                </Route>
              </Route>
              <Route path="/partner" element={<PartnerLayout />}>
                <Route index element={<PartnerHome />} />
                <Route path="signin" element={<PartnerSignIn />} />
                <Route path="signup" element={<PartnerSignUp />} />
                <Route path="create" element={<PartnerCreateCourse />} />
                <Route path="trainings" element={<PartnerTrainings />} />
                <Route
                  path="trainings/:id"
                  element={<PartnerCourseDetails />}
                />
                <Route
                  path="trainings/:id/edit"
                  element={<PartnerEditCourse />}
                />
                <Route path="students" element={<PartnerStudents />} />
                <Route path="students/:id" element={<StudentDetails />} />
                <Route path="settings" element={<PartnerSettingsLayout />}>
                  <Route index element={<PartnerSettings />} />
                  <Route path="account" element={<PartnerAccounts />} />
                </Route>
              </Route>
            </Routes>
            </Suspense>
            <ToastContainer
              transition={Slide}
              hideProgressBar
              autoClose={6000}
              position="bottom-right"
            />
            <ReactQueryDevtoolsGate />
          </QueryClientProvider>
        </NuqsAdapter>
      </ErrorBoundary>
    </MantineProvider>
  );
}

export default App;
