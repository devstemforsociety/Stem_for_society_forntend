import { createTheme, MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { useEffect, useState, Suspense } from "react";
import type { ComponentType } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ErrorBoundary from "./components/ErrorBoundary";
import ConnectionBanner from "./components/error/ConnectionBanner";
import RouteErrorBoundary from "./components/error/RouteErrorBoundary";
import { lazyWithRetry } from "./lib/lazyWithRetry";

const AdminApplicationsLayout = lazyWithRetry(() => import("./layouts/AdminApplicationsLayout"));
const AdminLayout = lazyWithRetry(() => import("./layouts/AdminLayout"));
const PartnerLayout = lazyWithRetry(() => import("./layouts/PartnerLayout"));
const PartnerSettingsLayout = lazyWithRetry(() => import("./layouts/PartnerSettingsLayout"));
const AdminBlogs = lazyWithRetry(() => import("./pages/admin/AdminBlogs"));
const AdminBlogSpotlight = lazyWithRetry(() => import("./pages/admin/AdminBlogSpotlight"));
const AdminCampusAmbassador = lazyWithRetry(() => import("./pages/admin/AdminCampusAmbassador"));
const AdminHome = lazyWithRetry(() => import("./pages/admin/AdminHome"));
const AdminInstitutionRegistrations = lazyWithRetry(() => import("./pages/admin/AdminInstitutionPlan"));
const AdminInstitutionPlanBookings = lazyWithRetry(() => import("./pages/admin/AdminInstitutionPlanBookings"));
const AdminPartners = lazyWithRetry(() => import("./pages/admin/AdminParnters"));
const AdminPartnerDetails = lazyWithRetry(() => import("./pages/admin/AdminPartnerDetails"));
const AdminIndividual = lazyWithRetry(() => import("./pages/admin/AdminIndividual"));
const AdminSchedules = lazyWithRetry(() => import("./pages/admin/AdminSchedules"));
const AdminSignIn = lazyWithRetry(() => import("./pages/admin/AdminSignIn"));
const AdminStudentDetails = lazyWithRetry(() => import("./pages/admin/AdminStudentDetails"));
const AdminStudents = lazyWithRetry(() => import("./pages/admin/AdminStudents"));
const AdminTrainings = lazyWithRetry(() => import("./pages/admin/AdminTrainings"));
const AdminTrainingSpotlight = lazyWithRetry(() => import("./pages/admin/AdminTrainingSpotlight"));
const AdminTransactions = lazyWithRetry(() => import("./pages/admin/AdminTransactions"));
const BlogCreate = lazyWithRetry(() => import("./pages/BlogCreate"));
const BlogListing = lazyWithRetry(() => import("./pages/BlogListing"));
const BlogSpotlight = lazyWithRetry(() => import("./pages/BlogSpotlight"));
const CampusAmbassador = lazyWithRetry(() => import("./pages/CampusAmbassador"));
const Home = lazyWithRetry(() => import("./pages/home"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const PartnerAccounts = lazyWithRetry(() => import("./pages/partner/PartnerAccount"));
const PartnerCourseDetails = lazyWithRetry(() => import("./pages/partner/PartnerCourseDetails"));
const PartnerCreateCourse = lazyWithRetry(() => import("./pages/partner/PartnerCreateCourse"));
const PartnerHome = lazyWithRetry(() => import("./pages/partner/PartnerHome"));
const PartnerEditCourse = lazyWithRetry(() => import("./pages/partner/PartnerEditCourse"));
const PartnerSettings = lazyWithRetry(() => import("./pages/partner/PartnerSettings"));
const PartnerSignIn = lazyWithRetry(() => import("./pages/partner/PartnerSignIn"));
const PartnerStudents = lazyWithRetry(() => import("./pages/partner/PartnerStudents"));
const PartnerTrainings = lazyWithRetry(() => import("./pages/partner/PartnerTrainings"));
const PartnerSignUp = lazyWithRetry(() => import("./pages/partner/PartnerWithUs"));
const StudentDetails = lazyWithRetry(() => import("./pages/partner/StudentDetails"));
const ForgotPassword = lazyWithRetry(() => import("./pages/forgotPassword"));
const SignUp = lazyWithRetry(() => import("./pages/Signup"));
const Training = lazyWithRetry(() => import("./pages/Training"));
const TrainingSpotlight = lazyWithRetry(() => import("./pages/TrainingSpotlight"));
const ExploreProgramDashboard = lazyWithRetry(() => import("./pages/ExploreProgramDashboard"));
const InstitutionPricing = lazyWithRetry(() => import("./pages/InstitutionPricing"));
const CampusAmbassadorDash = lazyWithRetry(() => import("./pages/CampusAmbassadorDash"));
const CampusAmbassadorBooking = lazyWithRetry(() => import("./pages/CampusAmbassadorBooking"));
const PartnerRole = lazyWithRetry(() => import("./pages/PartnerRole"));
const CampusAmbassadorSignup = lazyWithRetry(() => import("./pages/CampusAmbassadorSignup"));
const InstitutionPortal = lazyWithRetry(() => import("./pages/PartnerInstitutionPortal"));
const InstitutionLogin = lazyWithRetry(() => import("./pages/InstitutionLogin"));
const Courses = lazyWithRetry(() => import("./pages/Courses"));
const CourseDetail = lazyWithRetry(() => import("./pages/CourseDetail"));
const Community = lazyWithRetry(() => import("./pages/Community"));
const Blog = lazyWithRetry(() => import("./pages/Blog"));
const BlogArticle = lazyWithRetry(() => import("./pages/BlogArticle"));
const BlogPost = lazyWithRetry(() => import("./pages/BlogPost"));
const InstitutionBookingFlow = lazyWithRetry(() => import("./pages/InstitutionBookingFlow"));
const InstitutionOrIndividual = lazyWithRetry(() => import("./pages/InstitutionOrIndividual"));
const FinishingSchool = lazyWithRetry(() => import("./pages/FinishingSchool"));
const AcademyDetail = lazyWithRetry(() => import("./pages/AcademyDetail"));
const SkillDevelopment = lazyWithRetry(() => import("./pages/SkillDevelopment"));
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"));
const PrivacyPolicy = lazyWithRetry(() => import("./components1/PrivacyPolicy"));
const RefundPolicy = lazyWithRetry(() => import("./components1/RefundPolicy"));
const TermsConditions = lazyWithRetry(() => import("./components1/TermsConditions"));
const ComingSoon = lazyWithRetry(() => import("./components1/ComingSoon"));
const NotFound = lazyWithRetry(() => import("./pages/404/NotFound").then(m => ({ default: m.NotFound })));
const BareNotFound = () => <NotFound variant="bare" />;




import { queryClient } from "./lib/api";
import ScrollToTop from "./components/ScrollToTop";

































// import PricingPage from "./pages/Pricing";

// import PrivacyPolicy from "./pages/PrivacyPolicy";

// import RefundPolicy from "./pages/RefundPolicy";

































function AppLayout() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        {/* Inside the layout on purpose: if a page crashes, only the content
            region is replaced - the site around it keeps working. */}
        <RouteErrorBoundary>
          <Outlet />
        </RouteErrorBoundary>
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
              {/* Backstop for routes that sit outside a layout, and for a
                  crash in a layout itself. Layout-level boundaries handle the
                  ordinary case and keep the chrome on screen. */}
              <RouteErrorBoundary variant="page" source="route-root">
              {/* Every route change starts at the top of the new page. */}
              <ScrollToTop />
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
                    path="ca-programs"
                    element={<AdminCampusAmbassador />}
                  />
                  <Route
                    path="institutions"
                    element={<AdminInstitutionRegistrations />}
                  />
                  <Route
                    path="institution-plans"
                    element={<AdminInstitutionPlanBookings />}
                  />
                  <Route path="*" element={<BareNotFound />} />
                </Route>
                <Route path="*" element={<BareNotFound />} />
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
                <Route path="*" element={<BareNotFound />} />
              </Route>
            </Routes>
              </RouteErrorBoundary>
            </Suspense>
            <ToastContainer
              transition={Slide}
              hideProgressBar
              autoClose={6000}
              position="bottom-right"
            />
            <ConnectionBanner />
            <ReactQueryDevtoolsGate />
          </QueryClientProvider>
        </NuqsAdapter>
      </ErrorBoundary>
    </MantineProvider>
  );
}

export default App;
